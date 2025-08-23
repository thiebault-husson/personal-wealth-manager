import { v4 as uuidv4 } from 'uuid';
import type { User } from '../../../shared/types/index.js';
import type { CreateUserInput } from '../validators/user/profile.js';

// In-memory storage for now (will be replaced with ChromaDB)
const users: User[] = [];

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserInput): Promise<User> {
    // Normalize email for comparison
    const normalizedEmail = userData.email.toLowerCase().trim();
    
    // Check if email already exists
    const existingUser = users.find(user => user.email === normalizedEmail);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: uuidv4(),
      full_name: userData.full_name.trim(),
      email: normalizedEmail,
      filing_status: userData.filing_status,
      residency_state: userData.residency_state.trim(),
      residency_city: userData.residency_city.trim(),
      age: userData.age,
      dependents: userData.dependents,
      risk_tolerance: userData.risk_tolerance,
      goals: userData.goals.map(goal => goal.trim()) as [string, string, string]
    };

    // Store user
    users.push(newUser);

    if (process.env.NODE_ENV !== 'test') {
      const maskedEmail = newUser.email.replace(/(.{2}).+(@.+)/, '$1***$2');
      console.log(`✅ Created user: ${newUser.full_name} (${maskedEmail})`);
    }
    return newUser;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    const user = users.find(user => user.id === id);
    return user || null;
  }

  /**
   * Get all users (for testing purposes)
   */
  static async getAllUsers(): Promise<User[]> {
    return [...users]; // Return copy to prevent direct mutation
  }

  /**
   * Get user count (for health checks)
   */
  static getUserCount(): number {
    return users.length;
  }
}
