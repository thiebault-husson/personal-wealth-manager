import { User, Account, Position } from '../../../shared/types';

const BASE_URL = 'http://localhost:3000';

// Health API
export const healthAPI = {
  check: async () => {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }
};

// User API
export const userAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch(`${BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    return response.json();
  },

  getById: async (id: string): Promise<User> => {
    const response = await fetch(`${BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    return response.json();
  },

  create: async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }
    return response.json();
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }
  }
};

// Account API
export const accountAPI = {
  getAll: async (): Promise<Account[]> => {
    const response = await fetch(`${BASE_URL}/accounts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }
    return response.json();
  },

  getById: async (id: string): Promise<Account> => {
    const response = await fetch(`${BASE_URL}/accounts/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }
    return response.json();
  },

  getByUserId: async (userId: string): Promise<Account[]> => {
    const response = await fetch(`${BASE_URL}/accounts/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user accounts: ${response.statusText}`);
    }
    return response.json();
  },

  create: async (account: Omit<Account, 'id' | 'currency'>): Promise<Account> => {
    const response = await fetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    if (!response.ok) {
      throw new Error(`Failed to create account: ${response.statusText}`);
    }
    return response.json();
  }
};

// Position API
export const positionAPI = {
  getAll: async (): Promise<Position[]> => {
    const response = await fetch(`${BASE_URL}/positions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.statusText}`);
    }
    return response.json();
  },

  getById: async (id: string): Promise<Position> => {
    const response = await fetch(`${BASE_URL}/positions/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch position: ${response.statusText}`);
    }
    return response.json();
  },

  getByUserId: async (userId: string): Promise<Position[]> => {
    const response = await fetch(`${BASE_URL}/positions/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user positions: ${response.statusText}`);
    }
    return response.json();
  },

  create: async (position: Omit<Position, 'id'>): Promise<Position> => {
    const response = await fetch(`${BASE_URL}/positions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(position),
    });
    if (!response.ok) {
      throw new Error(`Failed to create position: ${response.statusText}`);
    }
    return response.json();
  }
};
