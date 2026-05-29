import axios from 'axios';

class OllamaService {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.embeddingModel = 'nomic-embed-text';
    this.generationModel = 'llama3.2:latest';
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
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      return response.data.models ? response.data.models.map(m => m.name) : [];
    } catch (err) {
      console.error('Failed to list models:', err.message);
      return [];
    }
  }

  async embed(text) {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/embed`,
        {
          model: this.embeddingModel,
          input: text
        },
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

  async generate(question, context, model = this.generationModel) {
    try {
      const prompt = `Context:
${context}

Question: ${question}

Answer:`;

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false,
          temperature: 0.7
        },
        { timeout: 60000 }
      );

      if (response.data.error) {
        throw new Error(response.data.error.toString());
      }

      const generated = response.data.response || response.data.output || '';
      if (!generated) {
        throw new Error('Ollama returned no text output');
      }

      return generated;
    } catch (err) {
      console.error('Generation error:', err.response?.data || err.message);
      const message = err.response?.data?.error || err.response?.data?.message || err.message;
      throw new Error(`Failed to generate response: ${message}`);
    }
  }
}

export default new OllamaService();
