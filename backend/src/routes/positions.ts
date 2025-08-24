import express from 'express';
import { PositionService } from '../services/positionService.js';
import { createPositionSchema, positionIdSchema, accountIdSchema, userIdSchema, quantitySchema, valueSchema } from '../validators/position/profile.js';

const router = express.Router();

/**
 * POST /positions - Create a new position
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = createPositionSchema.parse(req.body);
    const newPosition = await PositionService.createPosition(validatedData);
    
    res.status(201).location(`/positions/${newPosition.id}`).json({
      success: true,
      data: newPosition,
      message: 'Position created successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Account not found') {
        return res.status(404).json({
          success: false,
          error: 'Account not found',
          message: 'Cannot create position for non-existent account'
        });
      }
      
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        message: error.message
      });
    }
    
    console.error('❌ Position creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create position'
    });
  }
});

/**
 * GET /positions/:id - Get position by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = positionIdSchema.parse(req.params.id);
    const position = await PositionService.getPositionById(id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Position not found',
        message: 'Position with this ID does not exist'
      });
    }
    
    res.json({
      success: true,
      data: position
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid position ID',
        message: error.message
      });
    }
    
    console.error('❌ Get position error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve position'
    });
  }
});

/**
 * GET /positions/account/:accountId - Get all positions for an account
 */
router.get('/account/:accountId', async (req, res) => {
  try {
    const accountId = accountIdSchema.parse(req.params.accountId);
    const positions = await PositionService.getPositionsByAccountId(accountId);
    
    res.json({
      success: true,
      data: positions,
      count: positions.length
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid account ID',
        message: error.message
      });
    }
    
    console.error('❌ Get account positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve account positions'
    });
  }
});

/**
 * GET /positions/user/:userId - Get all positions for a user (across all accounts)
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = userIdSchema.parse(req.params.userId);
    const positions = await PositionService.getPositionsByUserId(userId);
    
    res.json({
      success: true,
      data: positions,
      count: positions.length
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid user ID',
        message: error.message
      });
    }
    
    console.error('❌ Get user positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user positions'
    });
  }
});

/**
 * PUT /positions/:id/quantity - Update position quantity
 */
router.put('/:id/quantity', async (req, res) => {
  try {
    const id = positionIdSchema.parse(req.params.id);
    const quantity = quantitySchema.parse(req.body.quantity);
    
    const updatedPosition = await PositionService.updatePositionQuantity(id, quantity);
    
    if (!updatedPosition) {
      return res.status(404).json({
        success: false,
        error: 'Position not found',
        message: 'Position with this ID does not exist'
      });
    }
    
    res.json({
      success: true,
      data: updatedPosition,
      message: 'Position quantity updated successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid quantity') {
        return res.status(422).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be a positive finite number'
        });
      }
      
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        message: error.message
      });
    }
    
    console.error('❌ Update position quantity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update position quantity'
    });
  }
});

/**
 * PUT /positions/:id/value - Update position value
 */
router.put('/:id/value', async (req, res) => {
  try {
    const id = positionIdSchema.parse(req.params.id);
    const value = valueSchema.parse(req.body.value);
    
    const updatedPosition = await PositionService.updatePositionValue(id, value);
    
    if (!updatedPosition) {
      return res.status(404).json({
        success: false,
        error: 'Position not found',
        message: 'Position with this ID does not exist'
      });
    }
    
    res.json({
      success: true,
      data: updatedPosition,
      message: 'Position value updated successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid value') {
        return res.status(422).json({
          success: false,
          error: 'Invalid value',
          message: 'Value must be a positive finite number'
        });
      }
      
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        message: error.message
      });
    }
    
    console.error('❌ Update position value error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update position value'
    });
  }
});

/**
 * DELETE /positions/:id - Delete position
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = positionIdSchema.parse(req.params.id);
    const deleted = await PositionService.deletePosition(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Position not found',
        message: 'Position with this ID does not exist'
      });
    }
    
    res.json({
      success: true,
      message: 'Position deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid position ID',
        message: error.message
      });
    }
    
    console.error('❌ Delete position error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete position'
    });
  }
});

/**
 * GET /positions/user/:userId/portfolio - Get portfolio summary for a user
 */
router.get('/user/:userId/portfolio', async (req, res) => {
  try {
    const userId = userIdSchema.parse(req.params.userId);
    
    const [totalValue, summary] = await Promise.all([
      PositionService.getTotalPortfolioValue(userId),
      PositionService.getPortfolioSummary(userId)
    ]);
    
    res.json({
      success: true,
      data: {
        total_value: totalValue,
        asset_breakdown: summary
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(422).json({
        success: false,
        error: 'Invalid user ID',
        message: error.message
      });
    }
    
    console.error('❌ Get portfolio summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve portfolio summary'
    });
  }
});

export default router;
