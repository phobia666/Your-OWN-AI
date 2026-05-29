import './ResultsPanel.css'

export default function ResultsPanel({ searchResults, ragResult, activeTab, loading }) {
  return (
    <div className="results-panel">
      <h3 className="section-title">📊 Results</h3>
      
      {loading && (
        <div className="status loading">
          <span className="spinner"></span> Processing...
        </div>
      )}

      {activeTab === 'search' && !loading && searchResults.length === 0 && (
        <div className="status">
          No results yet. Try a search query!
        </div>
      )}

      {activeTab === 'search' && searchResults.length > 0 && (
        <div className="results">
          <div className="results-header">
            Found <strong>{searchResults.length}</strong> results
          </div>
          {searchResults.map((result, i) => (
            <div key={i} className="result-card">
              <div className="result-rank">
                #{result.rank} • {(result.distance * 100).toFixed(1)}% similarity
              </div>
              <div className="result-text">
                {result.text}
              </div>
              <div className="result-meta">
                <span className="category">{result.category}</span>
                <span className="distance">
                  dist: {result.distance.toFixed(4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rag' && ragResult && (
        <div className="rag-result">
          <div className="rag-answer">
            <h4>Answer</h4>
            <p>{ragResult.answer}</p>
          </div>

          <div className="rag-sources">
            <h4>Sources ({ragResult.retrievedDocs.length})</h4>
            <div className="sources-list">
              {ragResult.retrievedDocs.map((doc, i) => (
                <div key={i} className="source-item">
                  <div className="source-rank">#{doc.rank}</div>
                  <div className="source-text">{doc.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
