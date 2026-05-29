// Vector Database implementation in JavaScript
// Implements: HNSW, KD-Tree, and Brute Force search

class VectorDB {
  constructor() {
    this.documents = [];
    this.nextId = 1;
    this.hnsw = null;
    this.kdtree = null;
  }

  insert(doc) {
    const id = this.nextId++;
    const item = {
      id,
      ...doc,
      embedding: doc.embedding
    };
    this.documents.push(item);
    
    // Rebuild indices
    this.rebuildIndices();
    
    return id;
  }

  delete(id) {
    this.documents = this.documents.filter(doc => doc.id !== id);
    this.rebuildIndices();
  }

  rebuildIndices() {
    this.hnsw = new HNSWIndex(this.documents);
    this.kdtree = new KDTree(this.documents);
  }

  // Distance metrics
  euclidean(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na < 1e-9 || nb < 1e-9) return 1.0;
    return 1.0 - dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  manhattan(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.abs(a[i] - b[i]);
    }
    return sum;
  }

  getDistanceFn(metric) {
    switch (metric.toLowerCase()) {
      case 'cosine':
        return this.cosine.bind(this);
      case 'manhattan':
        return this.manhattan.bind(this);
      case 'euclidean':
      default:
        return this.euclidean.bind(this);
    }
  }

  // Search algorithms
  searchBruteForce(queryEmbedding, k, metric = 'cosine') {
    const distFn = this.getDistanceFn(metric);
    const distances = this.documents.map(doc => ({
      ...doc,
      distance: distFn(queryEmbedding, doc.embedding)
    }));
    
    return distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k);
  }

  searchHNSW(queryEmbedding, k, metric = 'cosine') {
    if (this.documents.length === 0) return [];
    if (!this.hnsw || this.hnsw.documents.length === 0) {
      return this.searchBruteForce(queryEmbedding, k, metric);
    }
    return this.hnsw.search(queryEmbedding, k, metric);
  }

  searchKDTree(queryEmbedding, k, metric = 'cosine') {
    if (this.documents.length === 0) return [];
    if (!this.kdtree || this.kdtree.root === null) {
      return this.searchBruteForce(queryEmbedding, k, metric);
    }
    return this.kdtree.search(queryEmbedding, k, metric);
  }

  getAllDocuments() {
    return this.documents;
  }

  getStats() {
    return {
      totalDocuments: this.documents.length,
      embeddingDimension: this.documents.length > 0 ? this.documents[0].embedding.length : 0,
      categories: [...new Set(this.documents.map(d => d.category))],
      timestamp: new Date().toISOString()
    };
  }
}

// HNSW Implementation
class HNSWIndex {
  constructor(documents, maxM = 5, efConstruction = 200) {
    this.documents = documents;
    this.maxM = maxM;
    this.efConstruction = efConstruction;
    this.graph = new Map();
    this.entryPoint = null;
    this.build();
  }

  build() {
    if (this.documents.length === 0) return;
    
    this.documents.forEach(doc => {
      this.graph.set(doc.id, []);
    });
    
    // Simplified HNSW: connect to k nearest neighbors
    for (let i = 0; i < this.documents.length; i++) {
      const candidates = [];
      
      for (let j = 0; j < this.documents.length; j++) {
        if (i !== j) {
          const dist = this.distance(this.documents[i].embedding, this.documents[j].embedding);
          candidates.push({ id: this.documents[j].id, dist });
        }
      }
      
      candidates.sort((a, b) => a.dist - b.dist);
      const neighbors = candidates.slice(0, this.maxM).map(c => c.id);
      this.graph.set(this.documents[i].id, neighbors);
    }
    
    this.entryPoint = this.documents[0].id;
  }

  distance(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return 1.0 - dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  search(queryEmbedding, k, metric) {
    if (!this.entryPoint) return [];
    
    const visited = new Set();
    const candidates = [];
    const result = [];

    // Greedy search
    let current = this.entryPoint;
    let lowerBound = Infinity;

    for (let i = 0; i < Math.min(this.maxM * 2, this.documents.length); i++) {
      if (visited.has(current)) break;
      visited.add(current);

      const currentDoc = this.documents.find(d => d.id === current);
      const dist = this.distance(queryEmbedding, currentDoc.embedding);

      if (dist < lowerBound) {
        candidates.push({ ...currentDoc, distance: dist });
        result.push({ ...currentDoc, distance: dist });
        lowerBound = dist;
      }

      // Explore neighbors
      const neighbors = this.graph.get(current) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          current = neighborId;
          break;
        }
      }
    }

    return result.sort((a, b) => a.distance - b.distance).slice(0, k);
  }
}

// KD-Tree Implementation
class KDTree {
  constructor(documents) {
    this.documents = documents;
    this.root = null;
    this.build();
  }

  build() {
    if (this.documents.length === 0) return;
    this.root = this.buildTree(this.documents, 0);
  }

  buildTree(docs, depth) {
    if (docs.length === 0) return null;
    if (docs.length === 1) return { doc: docs[0], left: null, right: null };

    const k = docs[0].embedding.length;
    const axis = depth % k;

    docs.sort((a, b) => a.embedding[axis] - b.embedding[axis]);
    const median = Math.floor(docs.length / 2);

    return {
      doc: docs[median],
      left: this.buildTree(docs.slice(0, median), depth + 1),
      right: this.buildTree(docs.slice(median + 1), depth + 1)
    };
  }

  search(queryEmbedding, k, metric) {
    if (!this.root) return [];
    
    const distFn = metric === 'cosine' 
      ? (a, b) => this.cosineDist(a, b)
      : (a, b) => this.euclideanDist(a, b);

    const result = [];
    this.searchTree(this.root, queryEmbedding, 0, k, distFn, result);
    
    return result.sort((a, b) => a.distance - b.distance).slice(0, k);
  }

  searchTree(node, query, depth, k, distFn, result) {
    if (!node) return;

    const dist = distFn(query, node.doc.embedding);
    result.push({ ...node.doc, distance: dist });
    result.sort((a, b) => a.distance - b.distance);
    if (result.length > k) result.pop();

    const axis = depth % query.length;
    this.searchTree(node.left, query, depth + 1, k, distFn, result);
    this.searchTree(node.right, query, depth + 1, k, distFn, result);
  }

  euclideanDist(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  cosineDist(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return 1.0 - dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
}

const vectorDb = new VectorDB();
export default vectorDb;
