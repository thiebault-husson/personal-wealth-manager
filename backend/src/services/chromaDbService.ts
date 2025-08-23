import { ChromaClient } from 'chromadb';
import type { User } from '../../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * ChromaDB Service - Handles all database operations
 */
export class ChromaDbService {
  private static client: ChromaClient;
  private static usersCollection: any;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    try {
      console.log('🔌 Initializing ChromaDB connection...');
      
      this.client = new ChromaClient({ path: process.env.CHROMADB_URL || 'http://localhost:8000' });
      
      await this.client.heartbeat();
      console.log('✅ ChromaDB connection established');

      this.usersCollection = await this.client.getOrCreateCollection({
        name: 'users',
        metadata: { description: 'User profiles' }
      });

      this.isInitialized = true;
      console.log('✅ ChromaDB service initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize ChromaDB:', error);
      throw new Error(`ChromaDB initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  static async createUser(userData: Omit<User, 'id'>): Promise<User> {
    await this.ensureInitialized();

    try {
      const userId = uuidv4();
      const user: User = { id: userId, ...userData };

      await this.usersCollection.add({
        ids: [userId],
        documents: [JSON.stringify(user)],
        metadatas: [{
          user_id: userId,
          email: user.email,
          created_at: new Date().toISOString()
        }]
      });

      console.log(`✅ User created in ChromaDB: ${user.full_name}`);
      return user;

    } catch (error) {
      console.error('❌ Failed to create user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const results = await this.usersCollection.get({ ids: [id] });

      if (!results.documents || results.documents.length === 0) {
        return null;
      }

      const userDoc = results.documents[0];
      return userDoc ? JSON.parse(userDoc) as User : null;

    } catch (error) {
      console.error(`❌ Failed to get user ${id}:`, error);
      return null;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    await this.ensureInitialized();

    try {
      const total = await this.getUserCount();
      if (total === 0) return [];
      
      const pageSize = 500;
      const users: User[] = [];
      
      for (let offset = 0; offset < total; offset += pageSize) {
        const results = await this.usersCollection.get({ 
          limit: pageSize, 
          offset, 
          include: ['documents'] 
        });
        
        if (!results.documents) continue;
        
        for (const doc of results.documents) {
          if (!doc) continue;
          try {
            users.push(JSON.parse(doc) as User);
          } catch (parseError) {
            console.warn('⚠️ Failed to parse user document:', parseError);
          }
        }
      }
      
      return users;

    } catch (error) {
      console.error('❌ Failed to get all users:', error);
      return [];
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const results = await this.usersCollection.get({ where: { email: email } });

      if (!results.documents || results.documents.length === 0) {
        return null;
      }

      const userDoc = results.documents[0];
      return userDoc ? JSON.parse(userDoc) as User : null;

    } catch (error) {
      console.error(`❌ Failed to get user by email ${email}:`, error);
      return null;
    }
  }

  static async getUserCount(): Promise<number> {
    await this.ensureInitialized();

    try {
      const results = await this.usersCollection.count();
      return results;
    } catch (error) {
      console.error('❌ Failed to get user count:', error);
      return 0;
    }
  }
}
