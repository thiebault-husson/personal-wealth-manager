import { User, Account, Position } from '../../../shared/types/index.js';

const API_BASE_URL = 'http://localhost:3001';

// Health API
export const healthAPI = {
  async check() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
};

// User API
export const userAPI = {
  async create(userData: Omit<User, 'id'>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }
    
    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    const result = await response.json();
    return result.data;
  }
};

// Account API
export const accountAPI = {
  async create(accountData: Omit<Account, 'id'>): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create account');
    }
    
    const result = await response.json();
    return result.data;
  },

  async getByUserId(userId: string): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }
    const result = await response.json();
    return result.data;
  }
};

// Position API
export const positionAPI = {
  async create(positionData: Omit<Position, 'id'>): Promise<Position> {
    const response = await fetch(`${API_BASE_URL}/positions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(positionData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create position');
    }
    
    const result = await response.json();
    return result.data;
  },

  async getByUserId(userId: string): Promise<Position[]> {
    const response = await fetch(`${API_BASE_URL}/positions/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch positions');
    }
    const result = await response.json();
    return result.data;
  },

  async getPortfolioSummary(userId: string) {
    const response = await fetch(`${API_BASE_URL}/positions/user/${userId}/portfolio`);
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio summary');
    }
    const result = await response.json();
    return result.data;
  }
};
