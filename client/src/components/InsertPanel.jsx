import { useState } from 'react'
import './InsertPanel.css'

export default function InsertPanel({ onInsert, loading }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('general')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return

    onInsert(text, category)
    setText('')
    setCategory('general')
  }

  return (
    <div className="insert-panel">
      <h3 className="section-title">📝 Insert Document</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category" className="label">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="general">General</option>
            <option value="cs">Computer Science</option>
            <option value="math">Mathematics</option>
            <option value="food">Food & Cooking</option>
            <option value="sports">Sports</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="text" className="label">Document Text</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type document text here..."
            disabled={loading}
          />
        </div>

        <button 
          type="submit"
          className="btn-primary"
          disabled={!text.trim() || loading}
        >
          {loading ? 'Embedding...' : 'Insert'}
        </button>
      </form>

      <div className="hint">
        💡 Text will be automatically converted to embeddings using Ollama's nomic-embed-text model.
      </div>
    </div>
  )
}
