import express from 'express';
import { z } from 'zod';
import { createUserSchema, userIdSchema } from '../validators/user/profile.js';
import { UserService } from '../services/userService.js';

const router = express.Router();

/**
 * POST /users - Create a new user
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body using Zod
    const validatedData = createUserSchema.parse(req.body);
    
    // Create user through service
    const newUser = await UserService.createUser(validatedData);
    
    // Return success response with Location header
    res.status(201).location(`/users/${newUser.id}`).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      });
    }
    
    // Handle business logic errors (like duplicate email)
    if (error instanceof Error) {
      const isConflict = /already exists/i.test(error.message) || (error as any).status === 409;
      return res.status(isConflict ? 409 : 400).json({
        success: false,
        message: error.message,
        code: isConflict ? 'USER_EMAIL_CONFLICT' : undefined
      });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /users/:id - Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format using Zod
    const idValidation = userIdSchema.safeParse(id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        errors: idValidation.error.issues
      });
    }
    
    const user = await UserService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /users - Get all users (for testing)
 */
router.get('/', async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    
    res.json({
      success: true,
      message: `Found ${users.length} users`,
      data: users
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
