import { useState } from 'react'
import './RAGPanel.css'

export default function RAGPanel({ onRAG, loading }) {
  const [question, setQuestion] = useState('')
  const [k, setK] = useState(3)
  const [model, setModel] = useState('llama2')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!question.trim()) return
    onRAG(question, parseInt(k), model)
  }

  return (
    <div className="rag-panel">
      <h3 className="section-title">🤖 Ask AI (RAG Pipeline)</h3>
      
      <form onSubmit={handleSubmit} className="rag-form">
        <div className="form-group">
          <label htmlFor="question" className="label">Your Question</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="k" className="label">Context Documents</label>
            <input
              id="k"
              type="number"
              value={k}
              onChange={(e) => setK(e.target.value)}
              min="1"
              max="10"
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="model" className="label">LLM Model</label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            >
              <option value="llama2">Llama 2</option>
              <option value="neural-chat">Neural Chat</option>
              <option value="mistral">Mistral</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          className="btn-primary"
          disabled={!question.trim() || loading}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      <div className="rag-info">
        <p>
          🔍 <strong>Retrieval:</strong> Find most relevant documents<br/>
          🧠 <strong>Augmentation:</strong> Feed them as context<br/>
          💬 <strong>Generation:</strong> LLM generates answer
        </p>
      </div>
    </div>
  )
}
