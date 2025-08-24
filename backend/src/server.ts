import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import accountRoutes from './routes/accounts.js';
import positionRoutes from './routes/positions.js';
import ragRoutes from './routes/rag.js';
import { UserService } from './services/userService.js';
import { ChromaDbService } from './services/chromaDbService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/users', userRoutes);
app.use('/accounts', accountRoutes);
app.use('/positions', positionRoutes);
app.use('/rag', ragRoutes);

// Health check endpoint - you can test this immediately!
app.get('/health', async (req, res) => {
  try {
    const [users_count, accounts_count, positions_count] = await Promise.all([
      UserService.getUserCount(),
      ChromaDbService.getAccountCount(),
      ChromaDbService.getPositionCount()
    ]);
    res.json({
      status: 'ok',
      message: 'Personal Wealth Manager API is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      users_count,
      accounts_count,
      positions_count
    });
  } catch (err) {
    console.error('Health check dependency failure:', err);
    res.status(503).json({
      status: 'degraded',
      message: 'Health check failed: cannot access data stores',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      users_count: null,
      accounts_count: null,
      positions_count: null
    });
  }
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Personal Wealth Manager API',
    description: 'AI-powered personal financial advisor with RAG capabilities',
    endpoints: {
      health: '/health',
      users: '/users',
      accounts: '/accounts',
      positions: '/positions',
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
