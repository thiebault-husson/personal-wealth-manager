import { z } from 'zod';

/**
 * Position creation validator
 * Following Zod best practices from cursor-rules
 */
export const createPositionSchema = z.object({
  account_id: z.string()
    .uuid("Invalid account ID format")
    .describe("Account ID must be a valid UUID"),
  
  ticker: z.string()
    .trim()
    .min(1, "Ticker symbol is required")
    .max(10, "Ticker symbol must be at most 10 characters")
    .regex(/^[A-Z0-9.-]+$/i, "Ticker can only contain letters, numbers, dots, and hyphens")
    .transform(s => s.toUpperCase()),
  
  asset_type: z.enum(['stock', 'bond', 'etf', 'mutual_fund', 'cash', 'muni_bond', 'other'])
    .describe("Asset type must be one of: stock, bond, etf, mutual_fund, cash, muni_bond, other"),
  
  quantity: z.number()
    .positive("Quantity must be positive")
    .max(999999999, "Quantity seems unrealistic")
    .describe("Number of shares/units held"),
  
  value: z.number()
    .positive("Value must be positive")
    .max(999999999.99, "Value seems unrealistic")
    .describe("Total position value in USD")
});

export const positionIdSchema = z.string().uuid("Invalid position ID format");

export const accountIdSchema = z.string().uuid("Invalid account ID format");
export const userIdSchema = z.string().uuid("Invalid user ID format");

// Reusable quantity schema for updates
export const quantitySchema = z.number()
  .positive("Quantity must be positive")
  .max(999999999, "Quantity seems unrealistic");

// Reusable value schema for updates
export const valueSchema = z.number()
  .positive("Value must be positive")
  .max(999999999.99, "Value seems unrealistic");

export type CreatePositionInput = z.infer<typeof createPositionSchema>;
