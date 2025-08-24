import { v4 as uuidv4 } from 'uuid';
import type { Account } from '../../../shared/types/index.js';
import type { CreateAccountInput } from '../validators/account/profile.js';
import { ChromaDbService } from './chromaDbService.js';

export class AccountService {
  /**
   * Create a new account
   */
  static async createAccount(accountData: CreateAccountInput): Promise<Account> {
    // Verify user exists before creating account
    const user = await ChromaDbService.getUserById(accountData.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const newAccount: Account = {
      id: uuidv4(),
      user_id: accountData.user_id,
      account_type: accountData.account_type,
      provider: accountData.provider.trim(),
      balance: accountData.balance,
      currency: 'USD'
    };

    await ChromaDbService.addAccount(newAccount);

    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ Created account: ${newAccount.account_type} at ${newAccount.provider} ($${newAccount.balance.toLocaleString()})`);
    }
    
    return newAccount;
  }

  /**
   * Get account by ID
   */
  static async getAccountById(id: string): Promise<Account | null> {
    return await ChromaDbService.getAccountById(id);
  }

  /**
   * Get all accounts for a user
   */
  static async getAccountsByUserId(userId: string): Promise<Account[]> {
    return await ChromaDbService.getAccountsByUserId(userId);
  }

  /**
   * Get all accounts (for testing purposes)
   */
  static async getAllAccounts(): Promise<Account[]> {
    return await ChromaDbService.getAllAccounts();
  }

  /**
   * Update account balance
   */
  static async updateAccountBalance(id: string, newBalance: number): Promise<Account | null> {
    const account = await this.getAccountById(id);
    if (!account) {
      return null;
    }

    // Defensive validation at service layer
    if (!Number.isFinite(newBalance) || newBalance < 0 || newBalance > 999999999.99) {
      throw new Error('Invalid balance');
    }

    const updatedAccount: Account = {
      ...account,
      balance: newBalance
    };

    await ChromaDbService.updateAccount(updatedAccount);
    return updatedAccount;
  }

  /**
   * Delete account
   */
  static async deleteAccount(id: string): Promise<boolean> {
    return await ChromaDbService.deleteAccount(id);
  }

  /**
   * Get account count for a user
   */
  static async getAccountCountByUserId(userId: string): Promise<number> {
    return await ChromaDbService.getAccountCountByUserId(userId);
  }
}
