import express from 'express';
import { AccountService } from '../services/accountService.js';
import { createAccountSchema, accountIdSchema, balanceSchema } from '../validators/account/profile.js';

const router = express.Router();

/**
 * POST /accounts - Create a new account
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = createAccountSchema.parse(req.body);
    const newAccount = await AccountService.createAccount(validatedData);
    
    res.status(201).location(`/accounts/${newAccount.id}`).json({
      success: true,
      data: newAccount,
      message: 'Account created successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'Cannot create account for non-existent user'
        });
      }
      
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        message: error.message
      });
    }
    
    console.error('❌ Account creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create account'
    });
  }
});

/**
 * GET /accounts/:id - Get account by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = accountIdSchema.parse(req.params.id);
    const account = await AccountService.getAccountById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: 'Account with this ID does not exist'
      });
    }
    
    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid account ID',
        message: error.message
      });
    }
    
    console.error('❌ Get account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve account'
    });
  }
});

/**
 * GET /accounts/user/:userId - Get all accounts for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = accountIdSchema.parse(req.params.userId);
    const accounts = await AccountService.getAccountsByUserId(userId);
    
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid user ID',
        message: error.message
      });
    }
    
    console.error('❌ Get user accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user accounts'
    });
  }
});

/**
 * PUT /accounts/:id/balance - Update account balance
 */
router.put('/:id/balance', async (req, res) => {
  try {
    const id = accountIdSchema.parse(req.params.id);
    const balance = balanceSchema.parse(req.body.balance);
    
    const updatedAccount = await AccountService.updateAccountBalance(id, balance);
    
    if (!updatedAccount) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: 'Account with this ID does not exist'
      });
    }
    
    res.json({
      success: true,
      data: updatedAccount,
      message: 'Account balance updated successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid account ID',
        message: error.message
      });
    }
    
    console.error('❌ Update account balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update account balance'
    });
  }
});

/**
 * DELETE /accounts/:id - Delete account
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = accountIdSchema.parse(req.params.id);
    const deleted = await AccountService.deleteAccount(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: 'Account with this ID does not exist'
      });
    }
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid account ID',
        message: error.message
      });
    }
    
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete account'
    });
  }
});

export default router;
