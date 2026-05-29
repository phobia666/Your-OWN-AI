import './Header.css'

export default function Header({ ollamaStatus, stats }) {
  return (
    <header>
      <div>
        <h1>⚡ VectorDB</h1>
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
          Vector Database with HNSW + RAG
        </p>
      </div>
      
      <div className="header-badges">
        <div className="badge">
          Ollama: <span className={ollamaStatus === 'connected' ? 'ok' : 'err'}>
            {ollamaStatus === 'connected' ? '✓ Connected' : '✗ Disconnected'}
          </span>
        </div>
        
        {stats && (
          <>
            <div className="badge">
              Documents: <strong>{stats.totalDocuments}</strong>
            </div>
            <div className="badge">
              Dimension: <strong>{stats.embeddingDimension}D</strong>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
