import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
import type { User, Account, Position } from '../../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * ChromaDB Service - Handles all database operations
 */
export class ChromaDbService {
  private static client: ChromaClient;
  // If chromadb exposes a Collection type in your version, prefer it here:
  // import type { Collection } from 'chromadb';
  // private static usersCollection: Collection;
  // private static accountsCollection: Collection;
  // private static positionsCollection: Collection;
  private static usersCollection: any;
  private static accountsCollection: any;
  private static positionsCollection: any;
  private static isInitialized = false;
  private static initPromise: Promise<void> | null = null;

  static async initialize(): Promise<void> {
    try {
      console.log('🔌 Initializing ChromaDB connection...');
      
      this.client = new ChromaClient({ path: process.env.CHROMADB_URL || 'http://localhost:8000' });
      
      await this.client.heartbeat();
      console.log('✅ ChromaDB connection established');

      // Create embedding function for ChromaDB v3.0+
      const embeddingFunction = new DefaultEmbeddingFunction();

      // Create collections with proper embedding function
      try {
        this.usersCollection = await this.client.getCollection({ 
          name: 'users',
          embeddingFunction: embeddingFunction
        });
      } catch {
        this.usersCollection = await this.client.createCollection({
          name: 'users',
          metadata: { description: 'User profiles' },
          embeddingFunction: embeddingFunction
        });
      }

      try {
        this.accountsCollection = await this.client.getCollection({ 
          name: 'accounts',
          embeddingFunction: embeddingFunction
        });
      } catch {
        this.accountsCollection = await this.client.createCollection({
          name: 'accounts',
          metadata: { description: 'User accounts' },
          embeddingFunction: embeddingFunction
        });
      }

      try {
        this.positionsCollection = await this.client.getCollection({ 
          name: 'positions',
          embeddingFunction: embeddingFunction
        });
      } catch {
        this.positionsCollection = await this.client.createCollection({
          name: 'positions',
          metadata: { description: 'Account positions' },
          embeddingFunction: embeddingFunction
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
    if (this.isInitialized) return;
    if (!this.initPromise) {
      this.initPromise = this.initialize().finally(() => {
        this.initPromise = null;
      });
    }
    await this.initPromise;
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
          type: account.type,
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
          type: account.type,
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

  // Position methods
  static async addPosition(position: Position): Promise<Position> {
    await this.ensureInitialized();

    try {
      await this.positionsCollection.add({
        ids: [position.id],
        documents: [JSON.stringify(position)],
        metadatas: [{
          position_id: position.id,
          account_id: position.account_id,
          ticker: position.ticker,
          asset_type: position.asset_type,
          created_at: new Date().toISOString()
        }]
      });

      return position;
    } catch (error) {
      console.error('❌ Failed to add position:', error);
      throw new Error(`Failed to add position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPositionById(id: string): Promise<Position | null> {
    await this.ensureInitialized();

    try {
      const results = await this.positionsCollection.get({ ids: [id], include: ['documents'] });

      if (!results.documents || results.documents.length === 0) {
        return null;
      }

      const positionDoc = results.documents[0];
      return positionDoc ? JSON.parse(positionDoc) as Position : null;

    } catch (error) {
      console.error(`❌ Failed to get position ${id}:`, error);
      return null;
    }
  }

  static async getPositionsByAccountId(accountId: string): Promise<Position[]> {
    await this.ensureInitialized();

    try {
      // Fallback: get all positions and filter by account_id (for compatibility)
      const allPositions = await this.getAllPositions();
      return allPositions.filter(position => position.account_id === accountId);

    } catch (error) {
      console.error(`❌ Failed to get positions for account ${accountId}:`, error);
      return [];
    }
  }

  static async getAllPositions(): Promise<Position[]> {
    await this.ensureInitialized();

    try {
      const total = await this.getPositionCount();
      if (total === 0) return [];
      
      const pageSize = 500;
      const positions: Position[] = [];
      
      for (let offset = 0; offset < total; offset += pageSize) {
        const results = await this.positionsCollection.get({ 
          limit: pageSize, 
          offset, 
          include: ['documents'] 
        });
        
        if (!results.documents) continue;
        
        for (const doc of results.documents) {
          if (!doc) continue;
          try {
            positions.push(JSON.parse(doc) as Position);
          } catch (parseError) {
            console.warn('⚠️ Failed to parse position document:', parseError);
          }
        }
      }
      
      return positions;
    } catch (error) {
      console.error('❌ Failed to get all positions:', error);
      return [];
    }
  }

  static async updatePosition(position: Position): Promise<Position> {
    await this.ensureInitialized();

    try {
      await this.positionsCollection.update({
        ids: [position.id],
        documents: [JSON.stringify(position)],
        metadatas: [{
          position_id: position.id,
          account_id: position.account_id,
          ticker: position.ticker,
          asset_type: position.asset_type,
          updated_at: new Date().toISOString()
        }]
      });

      return position;
    } catch (error) {
      console.error('❌ Failed to update position:', error);
      throw new Error(`Failed to update position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deletePosition(id: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      await this.positionsCollection.delete({ ids: [id] });
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete position ${id}:`, error);
      return false;
    }
  }

  static async getPositionCount(): Promise<number> {
    await this.ensureInitialized();

    try {
      const results = await this.positionsCollection.count();
      return results;
    } catch (error) {
      console.error('❌ Failed to get position count:', error);
      return 0;
    }
  }

  static async getPositionCountByAccountId(accountId: string): Promise<number> {
    await this.ensureInitialized();

    try {
      // Fallback: get positions by account ID and count them
      const accountPositions = await this.getPositionsByAccountId(accountId);
      return accountPositions.length;
    } catch (error) {
      console.error(`❌ Failed to get position count for account ${accountId}:`, error);
      return 0;
    }
  }
}
