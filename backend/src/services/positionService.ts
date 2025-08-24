import { v4 as uuidv4 } from 'uuid';
import type { Position } from '../../../shared/types/index.js';
import type { CreatePositionInput } from '../validators/position/profile.js';
import { ChromaDbService } from './chromaDbService.js';

export class PositionService {
  /**
   * Create a new position
   */
  static async createPosition(positionData: CreatePositionInput): Promise<Position> {
    // Verify account exists before creating position
    const account = await ChromaDbService.getAccountById(positionData.account_id);
    if (!account) {
      throw new Error('Account not found');
    }

    // Defensive validation (mirror update guards)
    if (!Number.isFinite(positionData.quantity) || positionData.quantity <= 0 || positionData.quantity > 999_999_999) {
      throw new Error('Invalid quantity');
    }
    if (!Number.isFinite(positionData.value) || positionData.value <= 0 || positionData.value > 999_999_999.99) {
      throw new Error('Invalid value');
    }

    const newPosition: Position = {
      id: uuidv4(),
      account_id: positionData.account_id,
      ticker: positionData.ticker, // Already transformed to uppercase by Zod
      asset_type: positionData.asset_type,
      quantity: positionData.quantity,
      value: positionData.value
    };

    const persisted = await ChromaDbService.addPosition(newPosition);

    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ Created position: ${persisted.ticker} (${persisted.asset_type}) - ${persisted.quantity} units @ $${persisted.value.toLocaleString()} total`);
    }
    
    return persisted;
  }

  /**
   * Get position by ID
   */
  static async getPositionById(id: string): Promise<Position | null> {
    return await ChromaDbService.getPositionById(id);
  }

  /**
   * Get all positions for an account
   */
  static async getPositionsByAccountId(accountId: string): Promise<Position[]> {
    return await ChromaDbService.getPositionsByAccountId(accountId);
  }

  /**
   * Get all positions for a user (across all accounts)
   */
  static async getPositionsByUserId(userId: string): Promise<Position[]> {
    // First get all user's accounts
    const accounts = await ChromaDbService.getAccountsByUserId(userId);
    if (accounts.length === 0) {
      return [];
    }

    // Get positions for all accounts in parallel
    const positionsByAccount = await Promise.all(
      accounts.map((a) => this.getPositionsByAccountId(a.id))
    );
    return positionsByAccount.flat();
  }

  /**
   * Get all positions (for testing purposes)
   */
  static async getAllPositions(): Promise<Position[]> {
    return await ChromaDbService.getAllPositions();
  }

  /**
   * Update position quantity
   */
  static async updatePositionQuantity(id: string, newQuantity: number): Promise<Position | null> {
    const position = await this.getPositionById(id);
    if (!position) {
      return null;
    }

    // Defensive validation at service layer
    if (!Number.isFinite(newQuantity) || newQuantity <= 0 || newQuantity > 999999999) {
      throw new Error('Invalid quantity');
    }

    const updatedPosition: Position = {
      ...position,
      quantity: newQuantity
    };

    const persisted = await ChromaDbService.updatePosition(updatedPosition);
    return persisted;
  }

  /**
   * Update position value
   */
  static async updatePositionValue(id: string, newValue: number): Promise<Position | null> {
    const position = await this.getPositionById(id);
    if (!position) {
      return null;
    }

    // Defensive validation at service layer
    if (!Number.isFinite(newValue) || newValue <= 0 || newValue > 999999999.99) {
      throw new Error('Invalid value');
    }

    const updatedPosition: Position = {
      ...position,
      value: newValue
    };

    const persisted = await ChromaDbService.updatePosition(updatedPosition);
    return persisted;
  }

  /**
   * Delete position
   */
  static async deletePosition(id: string): Promise<boolean> {
    return await ChromaDbService.deletePosition(id);
  }

  /**
   * Get position count for an account
   */
  static async getPositionCountByAccountId(accountId: string): Promise<number> {
    return await ChromaDbService.getPositionCountByAccountId(accountId);
  }

  /**
   * Get total portfolio value for a user
   */
  static async getTotalPortfolioValue(userId: string): Promise<number> {
    const positions = await this.getPositionsByUserId(userId);
    return positions.reduce((total, position) => total + position.value, 0);
  }

  /**
   * Get portfolio summary by asset type for a user
   */
  static async getPortfolioSummary(userId: string): Promise<Record<string, { count: number; value: number }>> {
    const positions = await this.getPositionsByUserId(userId);
    const summary: Record<string, { count: number; value: number }> = {};

    for (const position of positions) {
      if (!summary[position.asset_type]) {
        summary[position.asset_type] = { count: 0, value: 0 };
      }
      summary[position.asset_type]!.count++;
      summary[position.asset_type]!.value += position.value;
    }

    return summary;
  }
}
