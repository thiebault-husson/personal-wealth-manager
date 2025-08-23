import { ChromaClient } from 'chromadb';
import type { User, Account } from '../../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * ChromaDB Service - Handles all database operations
 */
export class ChromaDbService {
  private static client: ChromaClient;
  private static usersCollection: any;
  private static accountsCollection: any;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    try {
      console.log('🔌 Initializing ChromaDB connection...');
      
      this.client = new ChromaClient({ path: process.env.CHROMADB_URL || 'http://localhost:8000' });
      
      await this.client.heartbeat();
      console.log('✅ ChromaDB connection established');

      // Create collections without embedding function for basic document storage
      try {
        this.usersCollection = await this.client.getCollection({ name: 'users' });
      } catch {
        this.usersCollection = await this.client.createCollection({
          name: 'users',
          metadata: { description: 'User profiles' }
        });
      }

      try {
        this.accountsCollection = await this.client.getCollection({ name: 'accounts' });
      } catch {
        this.accountsCollection = await this.client.createCollection({
          name: 'accounts',
          metadata: { description: 'User accounts' }
        });
      }

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
      // Fallback: get all users and filter by email (for compatibility)
      const allUsers = await this.getAllUsers();
      return allUsers.find(user => user.email === email) || null;

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

  // Account methods
  static async addAccount(account: Account): Promise<Account> {
    await this.ensureInitialized();

    try {
      await this.accountsCollection.add({
        ids: [account.id],
        documents: [JSON.stringify(account)],
        metadatas: [{
          account_id: account.id,
          user_id: account.user_id,
          account_type: account.account_type,
          created_at: new Date().toISOString()
        }]
      });

      return account;
    } catch (error) {
      console.error('❌ Failed to add account:', error);
      throw new Error(`Failed to add account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAccountById(id: string): Promise<Account | null> {
    await this.ensureInitialized();

    try {
      const results = await this.accountsCollection.get({ ids: [id] });

      if (!results.documents || results.documents.length === 0) {
        return null;
      }

      const accountDoc = results.documents[0];
      return accountDoc ? JSON.parse(accountDoc) as Account : null;

    } catch (error) {
      console.error(`❌ Failed to get account ${id}:`, error);
      return null;
    }
  }

  static async getAccountsByUserId(userId: string): Promise<Account[]> {
    await this.ensureInitialized();

    try {
      // Fallback: get all accounts and filter by user_id (for compatibility)
      const allAccounts = await this.getAllAccounts();
      return allAccounts.filter(account => account.user_id === userId);

    } catch (error) {
      console.error(`❌ Failed to get accounts for user ${userId}:`, error);
      return [];
    }
  }

  static async getAllAccounts(): Promise<Account[]> {
    await this.ensureInitialized();

    try {
      const total = await this.getAccountCount();
      if (total === 0) return [];
      
      const pageSize = 500;
      const accounts: Account[] = [];
      
      for (let offset = 0; offset < total; offset += pageSize) {
        const results = await this.accountsCollection.get({ 
          limit: pageSize, 
          offset, 
          include: ['documents'] 
        });
        
        if (!results.documents) continue;
        
        for (const doc of results.documents) {
          if (!doc) continue;
          try {
            accounts.push(JSON.parse(doc) as Account);
          } catch (parseError) {
            console.warn('⚠️ Failed to parse account document:', parseError);
          }
        }
      }
      
      return accounts;
    } catch (error) {
      console.error('❌ Failed to get all accounts:', error);
      return [];
    }
  }

  static async updateAccount(account: Account): Promise<Account> {
    await this.ensureInitialized();

    try {
      await this.accountsCollection.update({
        ids: [account.id],
        documents: [JSON.stringify(account)],
        metadatas: [{
          account_id: account.id,
          user_id: account.user_id,
          account_type: account.account_type,
          updated_at: new Date().toISOString()
        }]
      });

      return account;
    } catch (error) {
      console.error('❌ Failed to update account:', error);
      throw new Error(`Failed to update account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteAccount(id: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      await this.accountsCollection.delete({ ids: [id] });
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete account ${id}:`, error);
      return false;
    }
  }

  static async getAccountCount(): Promise<number> {
    await this.ensureInitialized();

    try {
      const results = await this.accountsCollection.count();
      return results;
    } catch (error) {
      console.error('❌ Failed to get account count:', error);
      return 0;
    }
  }

  static async getAccountCountByUserId(userId: string): Promise<number> {
    await this.ensureInitialized();

    try {
      // Fallback: get accounts by user ID and count them
      const userAccounts = await this.getAccountsByUserId(userId);
      return userAccounts.length;
    } catch (error) {
      console.error(`❌ Failed to get account count for user ${userId}:`, error);
      return 0;
    }
  }
}
