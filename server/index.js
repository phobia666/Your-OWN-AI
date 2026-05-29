    
    import 'dotenv/config';
    import express from 'express';
    import cors from 'cors';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import vectorDb from './vectorDb.js';
    import ollamaService from './ollamaService.js';
   

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const app = express();
    
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    const PORT = process.env.PORT || 5000;
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

    // Initialize Ollama service
    ollamaService.setOllamaUrl(OLLAMA_URL);

    // ============================================================================
    // API ENDPOINTS
    // ============================================================================

    // Health check
    app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Get Ollama status
    app.get('/api/ollama-status', async (req, res) => {
    try {
        const isRunning = await ollamaService.checkConnection();
        res.json({ 
        connected: isRunning,
        url: OLLAMA_URL,
        models: await ollamaService.listModels()
        });
    } catch (err) {
        res.status(500).json({ error: err.message, connected: false });
    }
    });

    // Insert document
    app.post('/api/insert', async (req, res) => {
    try {
        const { text, category, metadata } = req.body;
        
        if (!text) {
        return res.status(400).json({ error: 'text is required' });
        }

        // Get embedding from Ollama
        const embedding = await ollamaService.embed(text);
        
        // Insert into vector DB
        const id = vectorDb.insert({
        text,
        embedding,
        category: category || 'general',
        metadata: metadata || '',
        timestamp: new Date().toISOString()
        });

        res.json({
        success: true,
        id,
        dimension: embedding.length,
        timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // Search with KNN
    app.post('/api/search', async (req, res) => {
    try {
        const { query, k = 5, algorithm = 'hnsw', metric = 'cosine' } = req.body;
        
        if (!query) {
        return res.status(400).json({ error: 'query is required' });
        }

        // Get embedding for query
        const queryEmbedding = await ollamaService.embed(query);

        // Search using specified algorithm
        let results;
        switch (algorithm.toLowerCase()) {
        case 'hnsw':
            results = vectorDb.searchHNSW(queryEmbedding, k, metric);
            break;
        case 'kdtree':
            results = vectorDb.searchKDTree(queryEmbedding, k, metric);
            break;
        case 'brute':
        default:
            results = vectorDb.searchBruteForce(queryEmbedding, k, metric);
        }

        res.json({
        query,
        algorithm,
        metric,
        results: results.map((r, i) => ({
            rank: i + 1,
            id: r.id,
            distance: r.distance,
            text: r.text,
            category: r.category,
            metadata: r.metadata
        }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // RAG - Retrieve and Generate
    app.post('/api/rag', async (req, res) => {
    try {
        const { question, k = 3, model } = req.body;
        const selectedModel = model || ollamaService.generationModel;
        
        if (!question) {
        return res.status(400).json({ error: 'question is required' });
        }

        // Get embedding for question
        const queryEmbedding = await ollamaService.embed(question);

        // Retrieve top-k documents
        const retrievedDocs = vectorDb.searchHNSW(queryEmbedding, k, 'cosine');
        const context = retrievedDocs
        .map(doc => doc.text)
        .join('\n\n');

        // Generate answer using LLM
        const answer = await ollamaService.generate(
        question,
        context,
        selectedModel
        );

        res.json({
        question,
        model: selectedModel,
        answer,
        retrievedDocs: retrievedDocs.map((r, i) => ({
            rank: i + 1,
            id: r.id,
            distance: r.distance,
            text: r.text.substring(0, 200) + '...',
            category: r.category
        }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // Get database stats
    app.get('/api/stats', (req, res) => {
    res.json(vectorDb.getStats());
    });

    // Delete document
    app.delete('/api/delete/:id', (req, res) => {
    try {
        const { id } = req.params;
        vectorDb.delete(parseInt(id));
        res.json({ success: true, id: parseInt(id) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // Get all documents
    app.get('/api/documents', (req, res) => {
    try {
        const docs = vectorDb.getAllDocuments();
        res.json({
        total: docs.length,
        documents: docs.map(d => ({
            id: d.id,
            text: d.text.substring(0, 100) + '...',
            category: d.category,
            timestamp: d.timestamp
        }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // Benchmark algorithms
    app.post('/api/benchmark', async (req, res) => {
    try {
        const { query, iterations = 3 } = req.body;
        
        if (!query) {
        return res.status(400).json({ error: 'query is required' });
        }

        const queryEmbedding = await ollamaService.embed(query);
        const results = {};

        // Benchmark each algorithm
        for (const algo of ['brute', 'kdtree', 'hnsw']) {
        const times = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            if (algo === 'hnsw') vectorDb.searchHNSW(queryEmbedding, 5, 'cosine');
            else if (algo === 'kdtree') vectorDb.searchKDTree(queryEmbedding, 5, 'cosine');
            else vectorDb.searchBruteForce(queryEmbedding, 5, 'cosine');
            times.push(performance.now() - start);
        }
        results[algo] = {
            avgTime: (times.reduce((a, b) => a + b) / times.length).toFixed(3),
            minTime: Math.min(...times).toFixed(3),
            maxTime: Math.max(...times).toFixed(3),
            unit: 'ms'
        };
        }

        res.json({ query, iterations, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // Serve static files (React build)
    app.use(express.static(path.join(__dirname, '../client/dist')));

    // SPA fallback
    app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });

    // Start server
    app.listen(PORT, () => {
    console.log(`✓ VectorDB API server running on http://localhost:${PORT}`);
    console.log(`✓ Ollama service: ${OLLAMA_URL}`);
    });

    export default app;
