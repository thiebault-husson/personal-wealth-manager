import type { User, Account, Position } from '@shared/types';

const BASE_URL = 'http://localhost:3000';

// Health API
export const healthAPI = {
  async check() {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }
};

// User API
export const userAPI = {
  async create(userData: Omit<User, 'id'>): Promise<User> {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create user: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<User | null> {
    const response = await fetch(`${BASE_URL}/users/${id}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  },

  async getAll(): Promise<User[]> {
    const response = await fetch(`${BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`Failed to get users: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  }
};

// Account API
export const accountAPI = {
  async create(accountData: Omit<Account, 'id'>): Promise<Account> {
    const response = await fetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create account: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  },

  async getByUserId(userId: string): Promise<Account[]> {
    const response = await fetch(`${BASE_URL}/accounts/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get accounts: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Account | null> {
    const response = await fetch(`${BASE_URL}/accounts/${id}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to get account: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  }
};

// Position API
export const positionAPI = {
  async create(positionData: Omit<Position, 'id'>, signal?: AbortSignal): Promise<Position> {
    console.log('🌐 Making position API request:', {
      url: `${BASE_URL}/positions`,
      data: positionData
    });

    const response = await fetch(`${BASE_URL}/positions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(positionData),
      signal
    });

    console.log('📡 Position API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Position API error response:', errorData);
      throw new Error(errorData.message || `Failed to create position: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Position API success response:', result);
    return result.data;
  },

  async getByUserId(userId: string): Promise<Position[]> {
    const response = await fetch(`${BASE_URL}/positions/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get positions: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  },

  async getByAccountId(accountId: string): Promise<Position[]> {
    const response = await fetch(`${BASE_URL}/positions/account/${accountId}`);
    if (!response.ok) {
      throw new Error(`Failed to get positions: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  },

  async getPortfolioSummary(userId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/positions/user/${userId}/portfolio`);
    if (!response.ok) {
      throw new Error(`Failed to get portfolio summary: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  }
};

// RAG API
export const ragAPI = {
  async query(userId: string, question: string, signal?: AbortSignal): Promise<{ question: string; response: string; user_context: any }> {
    console.log('🌐 Making RAG API request:', {
      url: `${BASE_URL}/rag/query`,
      userId,
      question
    });

    const response = await fetch(`${BASE_URL}/rag/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        question: question
      }),
      signal, // Pass the abort signal
    });

    console.log('📡 RAG API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ RAG API error response:', errorData);
      throw new Error(errorData.message || `Failed to query AI: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ RAG API success response:', result);
    return result.data;
  },

  async getHealth(): Promise<any> {
    const response = await fetch(`${BASE_URL}/rag/health`);
    if (!response.ok) {
      throw new Error(`Failed to get RAG health: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  }
};
