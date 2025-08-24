import express from 'express';
import { RAGService } from '../services/ragService.js';
import { ChromaDbService } from '../services/chromaDbService.js';

const router = express.Router();

/**
 * POST /rag/query
 * Query the RAG system for financial advice
 */
router.post('/query', async (req, res) => {
  try {
    const { user_id, question } = req.body;

    // Validate request
    if (!user_id || !question) {
      return res.status(400).json({
        success: false,
        message: 'user_id and question are required'
      });
    }

    if (typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'question must be a non-empty string'
      });
    }

    // Get user data
    const user = await ChromaDbService.getUserById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's accounts and positions
    const [accounts, positions] = await Promise.all([
      ChromaDbService.getAccountsByUserId(user_id),
      ChromaDbService.getPositionsByUserId(user_id)
    ]);

    // Query the RAG service
    const ragService = RAGService.getInstance();
    const response = await ragService.queryFinancialAdvice(
      question.trim(),
      user,
      accounts,
      positions
    );

    res.json({
      success: true,
      data: {
        question: question.trim(),
        response,
        user_context: {
          name: user.full_name,
          age: user.age,
          risk_tolerance: user.risk_tolerance,
          goals: user.goals
        }
      }
    });

  } catch (error) {
    console.error('RAG query error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return res.status(503).json({
          success: false,
          message: 'AI service is currently unavailable. Please ensure ANTHROPIC_API_KEY is configured.',
          error: 'AI_SERVICE_UNAVAILABLE'
        });
      }
      
      if (error.message.includes('ChromaDB')) {
        return res.status(503).json({
          success: false,
          message: 'Knowledge base is currently unavailable. Please try again later.',
          error: 'KNOWLEDGE_BASE_UNAVAILABLE'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your question. Please try again.',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /rag/health
 * Check RAG service health
 */
router.get('/health', async (req, res) => {
  try {
    const ragService = RAGService.getInstance();
    const health = await ragService.getHealth();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('RAG health check error:', error);
    res.status(500).json({
      success: false,
      message: 'RAG service health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
