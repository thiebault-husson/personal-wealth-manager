import express from 'express';
import { z } from 'zod';
import { AccountService } from '../services/accountService.js';
import { createAccountSchema, accountIdSchema } from '../validators/account/profile.js';
import { userIdSchema } from '../validators/user/profile.js';

const router = express.Router();

// POST /accounts - Create a new account
router.post('/', async (req, res) => {
  try {
    const accountData = createAccountSchema.parse(req.body);
    const account = await AccountService.createAccount(accountData);
    
    res.status(201)
      .location(`/accounts/${account.id}`)
      .json({
        success: true,
        data: account,
        message: 'Account created successfully'
      });
  } catch (error: unknown) {
    console.error('Account creation error:', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
      });
    }
    
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Don't expose internal error messages in production
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
    
    console.error('Unknown error in POST /accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /accounts/:id - Get account by ID
router.get('/:id', async (req, res) => {
  try {
    const id = accountIdSchema.parse(req.params.id);
    const account = await AccountService.getAccountById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }
    
    res.json({
      success: true,
      data: account
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        message: 'Invalid account ID format',
        errors: error.issues
      });
    }
    
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Unknown error in GET /accounts/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /accounts/user/:userId - Get all accounts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = userIdSchema.parse(req.params.userId);
    const accounts = await AccountService.getAccountsByUserId(userId);
    
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error: unknown) {
    console.error('Get accounts by user error:', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      
      return res.status(422).json({
        success: false,
        message: 'Invalid user ID format',
        errors: formattedErrors
      });
    }
    
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
