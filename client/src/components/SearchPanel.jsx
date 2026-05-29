import { useState } from 'react'
import './SearchPanel.css'

export default function SearchPanel({ onSearch, loading }) {
  const [query, setQuery] = useState('')
  const [k, setK] = useState(5)
  const [algorithm, setAlgorithm] = useState('hnsw')
  const [metric, setMetric] = useState('cosine')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    onSearch(query, parseInt(k), algorithm, metric)
  }

  return (
    <div className="search-panel">
      <h3 className="section-title">🔍 Vector Search</h3>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-group">
          <label htmlFor="query" className="label">Search Query</label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="k" className="label">Top-K Results</label>
            <input
              id="k"
              type="number"
              value={k}
              onChange={(e) => setK(e.target.value)}
              min="1"
              max="20"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="algorithm" className="label">Algorithm</label>
          <select
            id="algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={loading}
          >
            <option value="hnsw">HNSW (Fast)</option>
            <option value="kdtree">KD-Tree (Balanced)</option>
            <option value="brute">Brute Force (Accurate)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="metric" className="label">Distance Metric</label>
          <select
            id="metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            disabled={loading}
          >
            <option value="cosine">Cosine Similarity</option>
            <option value="euclidean">Euclidean Distance</option>
            <option value="manhattan">Manhattan Distance</option>
          </select>
        </div>

        <button 
          type="submit"
          className="btn-primary"
          disabled={!query.trim() || loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="algo-info">
        <div className="algo-item">
          <strong>HNSW</strong>
          <span>Production-grade, O(log n) complexity</span>
        </div>
        <div className="algo-item">
          <strong>KD-Tree</strong>
          <span>Balanced search tree, good for lower dimensions</span>
        </div>
        <div className="algo-item">
          <strong>Brute Force</strong>
          <span>O(n) but guaranteed accurate</span>
        </div>
      </div>
    </div>
  )
}
