# VectorDB - Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js 18+ (from https://nodejs.org)
- Ollama installed and running (from https://ollama.ai)

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Start Ollama
```bash
ollama serve
```

In another terminal, pull the required models:
```bash
ollama pull nomic-embed-text
ollama pull llama2
```

### Step 3: Run Development Servers
```bash
npm run dev
```

This starts:
- Backend API on http://localhost:5000
- Frontend on http://localhost:5173

## Docker Deployment (Recommended for Production)

### Deploy Locally with Docker
```bash
docker-compose up -d
```

Access the app at http://localhost:5000

### Deploy to Cloud

#### **Option 1: Heroku**
```bash
heroku login
heroku create your-app-name
git push heroku main
```

#### **Option 2: Railway.app** (Easiest)
1. Go to https://railway.app
2. Connect your GitHub repo
3. Add Ollama as a custom service
4. Deploy!

#### **Option 3: AWS/DigitalOcean/Azure**
1. Push Docker image to Docker Hub:
```bash
docker tag vectordb-app your-dockerhub-user/vectordb
docker push your-dockerhub-user/vectordb
```

2. Deploy using their container orchestration

#### **Option 4: Vercel + API Routes** (Frontend Only)
```bash
cd client
npm run build
vercel deploy
```

Then point to an external Ollama API.

## Environment Variables

Create `.env` file:
```env
PORT=5000
OLLAMA_URL=http://localhost:11434
NODE_ENV=production
```

## Performance Tips

1. **Increase memory** if running many documents
2. **Use HNSW algorithm** for large datasets (100k+ vectors)
3. **Cache embeddings** by storing them in a database
4. **Use CDN** for static assets

## Troubleshooting

### "Cannot connect to Ollama"
- Ensure Ollama is running: `ollama serve`
- Check OLLAMA_URL in `.env`

### "Port already in use"
- Change PORT in `.env` or:
```bash
PORT=3000 npm run server
```

### "Out of memory"
- Reduce batch size
- Use lighter models (mistral instead of llama2)
- Deploy to a server with more RAM

## Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed: `npm run install-all`
- [ ] Ollama running with models downloaded
- [ ] `.env` file configured
- [ ] Frontend builds: `npm run build`
- [ ] API runs: `npm start`
- [ ] Docker image builds: `docker build -t vectordb .`
- [ ] Docker compose works: `docker-compose up`
