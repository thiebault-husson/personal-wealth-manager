import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint - you can test this immediately!
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Personal Wealth Manager API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Personal Wealth Manager API',
    description: 'AI-powered personal financial advisor with RAG capabilities',
    endpoints: {
      health: '/health',
      users: '/users (coming soon)',
      accounts: '/accounts (coming soon)',
      query: '/query (coming soon)'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API info: http://localhost:${PORT}/`);
});

export default app;
