import type { User } from '../../../shared/types/index.js';
import type { CreateUserInput } from '../validators/user/profile.js';
import { ChromaDbService } from './chromaDbService.js';

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserInput): Promise<User> {
    // Normalize email for comparison
    const normalizedEmail = userData.email.toLowerCase().trim();
    
    // Check if email already exists
    const existingUser = await ChromaDbService.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Prepare user data
    const userToCreate = {
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

    // Create user in ChromaDB
    const newUser = await ChromaDbService.createUser(userToCreate);

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
    return await ChromaDbService.getUserById(id);
  }

  /**
   * Get all users (for testing purposes)
   */
  static async getAllUsers(): Promise<User[]> {
    return await ChromaDbService.getAllUsers();
  }

  /**
   * Get user count (for health checks)
   */
  static async getUserCount(): Promise<number> {
    return await ChromaDbService.getUserCount();
  }
}
