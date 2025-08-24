import { z } from 'zod';

/**
 * Account creation validator
 * Following Zod best practices from cursor-rules
 */
export const createAccountSchema = z.object({
  user_id: z.string()
    .uuid("Invalid user ID format")
    .describe("User ID must be a valid UUID"),
  
  account_type: z.enum(['401k', 'ira', 'roth_ira', 'brokerage', 'hsa', '529', 'cash', 'other'])
    .describe("Account type must be one of: 401k, ira, roth_ira, brokerage, hsa, 529, cash, other"),
  
  provider: z.string()
    .trim()
    .min(2, "Provider name must be at least 2 characters")
    .max(100, "Provider name must be less than 100 characters")
    .regex(/^[\p{L}\p{N}\s&.'(),\-\/]+$/u, "Provider name can include letters, numbers, spaces, &, ., -, ', (, ), and ,"),
  
  balance: z.number()
    .positive("Balance must be positive")
    .max(999999999.99, "Balance seems unrealistic")
    .describe("Account balance in USD")
});

export const accountIdSchema = z.string().uuid("Invalid account ID format");

// Reusable balance schema for updates and other flows
export const balanceSchema = z.number()
  .nonnegative("Balance must be non-negative")
  .max(999999999.99, "Balance seems unrealistic");

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
