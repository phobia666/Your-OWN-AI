import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Header from './components/Header'
import InsertPanel from './components/InsertPanel'
import SearchPanel from './components/SearchPanel'
import RAGPanel from './components/RAGPanel'
import ResultsPanel from './components/ResultsPanel'

const API_BASE = '/api'

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [ollamaStatus, setOllamaStatus] = useState('checking')
  const [stats, setStats] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [ragResult, setRagResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus()
    const interval = setInterval(checkOllamaStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update stats
  useEffect(() => {
    fetchStats()
  }, [])

  const checkOllamaStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/ollama-status`)
      setOllamaStatus(response.data.connected ? 'connected' : 'disconnected')
    } catch (err) {
      setOllamaStatus('error')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`)
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleInsert = async (text, category) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE}/insert`, {
        text,
        category,
        metadata: `Inserted at ${new Date().toLocaleString()}`
      })
      
      setSearchResults([])
      fetchStats()
      setActiveTab('search')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query, k, algorithm, metric) => {
    setLoading(true)
    setError(null)
    setRagResult(null)
    try {
      const response = await axios.post(`${API_BASE}/search`, {
        query,
        k,
        algorithm,
        metric
      })
      setSearchResults(response.data.results)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRAG = async (question, k, model) => {
    setLoading(true)
    setError(null)
    setSearchResults([])
    try {
      const response = await axios.post(`${API_BASE}/rag`, {
        question,
        k,
        model
      })
      setRagResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/delete/${id}`)
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="app">
      <Header ollamaStatus={ollamaStatus} stats={stats} />
      
      <div className="container">
        <div className="left-panel">
          <InsertPanel 
            onInsert={handleInsert}
            loading={loading}
          />
        </div>

        <div className="center-panel">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Vector Search
            </button>
            <button 
              className={`tab ${activeTab === 'rag' ? 'active' : ''}`}
              onClick={() => setActiveTab('rag')}
            >
              Ask AI (RAG)
            </button>
            <button 
              className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              Documents
            </button>
          </div>

          {error && (
            <div className="status error">
              ❌ {error}
            </div>
          )}

          {activeTab === 'search' && (
            <SearchPanel 
              onSearch={handleSearch}
              loading={loading}
            />
          )}

          {activeTab === 'rag' && (
            <RAGPanel 
              onRAG={handleRAG}
              loading={loading}
            />
          )}

          {activeTab === 'docs' && (
            <DocumentsPanel onDelete={handleDelete} />
          )}
        </div>

        <div className="right-panel">
          <ResultsPanel 
            searchResults={searchResults}
            ragResult={ragResult}
            activeTab={activeTab}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

// Documents Panel
function DocumentsPanel({ onDelete }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/documents`)
      setDocuments(response.data.documents)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-content active">
      <h3 className="section-title">Stored Documents ({documents.length})</h3>
      
      {loading ? (
        <div className="status loading">
          <span className="spinner"></span> Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="status">
          No documents stored yet. Insert some documents to get started!
        </div>
      ) : (
        <div className="results">
          {documents.map((doc, i) => (
            <div key={doc.id} className="card">
              <div className="result-rank">#{doc.id} • {doc.category}</div>
              <div className="result-text">{doc.text}</div>
              <div className="result-distance">
                <span>{new Date(doc.timestamp).toLocaleDateString()}</span>
                <button 
                  onClick={() => onDelete(doc.id)}
                  style={{
                    background: 'rgba(243, 139, 168, 0.12)',
                    color: '#f38ba8',
                    width: 'auto',
                    padding: '4px 8px',
                    fontSize: '11px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
