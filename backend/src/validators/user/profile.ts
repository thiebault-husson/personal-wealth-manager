import { z } from 'zod';

/**
 * User profile creation validator
 * Following Zod best practices from cursor-rules
 */
export const createUserSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  
  email: z.string()
    .email("Invalid email format")
    .toLowerCase(),
  
  filing_status: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household'])
    .describe("Filing status must be one of: single, married_joint, married_separate, head_of_household"),
  
  residency_state: z.string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State name too long"),
  
  residency_city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City name too long"),
  
  age: z.number()
    .int("Age must be a whole number")
    .min(18, "Must be at least 18 years old")
    .max(120, "Age must be realistic"),
  
  dependents: z.number()
    .int("Number of dependents must be a whole number")
    .min(0, "Dependents cannot be negative")
    .max(20, "Number of dependents seems unrealistic"),
  
  annual_income: z.number()
    .min(0, "Annual income cannot be negative")
    .max(10000000, "Annual income seems unrealistic")
    .describe("Annual gross income before taxes"),
  
  annual_bonus: z.number()
    .min(0, "Annual bonus cannot be negative")
    .max(5000000, "Annual bonus seems unrealistic")
    .describe("Expected annual bonus or variable compensation"),
  
  risk_tolerance: z.enum(['low', 'medium', 'high'])
    .describe("Risk tolerance must be: low, medium, or high"),
  
  goals: z.array(z.string().min(5, "Each goal must be at least 5 characters"))
    .length(3, "You must provide exactly 3 financial goals")
    .refine(
      (goals) => goals.every(goal => goal.trim().length >= 5),
      "All goals must be meaningful (at least 5 characters after trimming)"
    )
});

// Export type alongside schema (following cursor-rules)
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * User ID parameter validator
 */
export const userIdSchema = z.string().uuid("Invalid user ID format");

export type UserIdParam = z.infer<typeof userIdSchema>;
