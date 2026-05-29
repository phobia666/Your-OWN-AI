import axios from 'axios';
import Groq from 'groq-sdk';

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

class OllamaService {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.embeddingModel = 'nomic-embed-text';
    this.generationModel = 'llama-3.3-70b-versatile';
  }

  setOllamaUrl(url) {
    this.ollamaUrl = url;
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 3000 });
      return response.status === 200;
    } catch (err) {
      console.error('Ollama connection failed:', err.message);
      return false;
    }
  }

  async listModels() {
    return ['llama3-8b-8192'];
  }

  async embed(text) {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/embed`,
        { model: this.embeddingModel, input: text },
        { timeout: 30000 }
      );
      if (!response.data.embeddings || response.data.embeddings.length === 0) {
        throw new Error('No embeddings returned from Ollama');
      }
      return response.data.embeddings[0];
    } catch (err) {
      console.error('Embedding error:', err.message);
      throw new Error(`Failed to get embeddings: ${err.message}`);
    }
  }

  async generate(question, context, model = 'llama-3.3-70b-versatile') {
    try {
      const response = await groqClient.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: `Use this context to answer the question:\n${context}` },
          { role: 'user', content: question }
        ],
        temperature: 0.7
      });
      return response.choices[0].message.content || '';
    } catch (err) {
      console.error('Generation error:', err.message);
      throw new Error(`Failed to generate response: ${err.message}`);
    }
  }
}

export default new OllamaService();