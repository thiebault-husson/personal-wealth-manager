// Shared TypeScript interfaces for the Personal Wealth Manager

export interface User {
  id: string;
  full_name: string;
  email: string;
  filing_status: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  residency_state: string;
  residency_city: string;
  age: number;
  dependents: number;
  annual_income: number;
  annual_bonus: number; // Default to 0 if not provided
  risk_tolerance: 'low' | 'medium' | 'high';
  goals: [string, string, string]; // Exactly 3 goals
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: '401k' | '403b' | 'ira_traditional' | 'ira_roth' | 'brokerage' | 'savings' | 'checking' | 'hsa' | 'other';
  provider: string;
  balance: number;
  currency: 'USD';
  // Contribution settings for retirement accounts
  contribution_enabled?: boolean;
  contribution_type?: 'percentage' | 'fixed_amount';
  contribution_value?: number; // Either percentage (0-100) or dollar amount
}

export interface Position {
  id: string;
  account_id: string;
  ticker: string;
  asset_type: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'cash' | 'muni_bond' | 'other';
  quantity: number; // Number of shares/units held
  value: number; // Total position value in USD (not per-unit price)
}

export interface Insurance {
  id: string;
  user_id: string;
  policy_type: 'term_life' | 'whole_life' | 'universal_life' | 'disability' | 'long_term_care' | 'health' | 'other';
  provider: string;
  coverage_amount: number;
  annual_premium: number;
  cash_value?: number; // Only for whole_life and universal_life
  beneficiary?: string;
}

export interface RAGSource {
  id: string;
  doc_name: string;
  section: string;
  url: string;
  content: string;
  embedding: number[]; // Vector embedding
}

export interface Recommendation {
  id: string;
  user_id: string;
  query: string;
  response: string;
  sources: string[]; // References to RAG source IDs
  timestamp: Date;
}

// API Request/Response types
export interface CreateUserRequest {
  full_name: string;
  email: string;
  filing_status: User['filing_status'];
  residency_state: string;
  residency_city: string;
  age: number;
  dependents: number;
  annual_income: number;
  annual_bonus: number;
  risk_tolerance: User['risk_tolerance'];
  goals: [string, string, string];
}

export interface CreateAccountRequest {
  user_id: string;
  name: string;
  type: Account['type'];
  provider: string;
  balance: number;
}

export interface CreatePositionRequest {
  account_id: string;
  ticker: string;
  asset_type: Position['asset_type'];
  quantity: number;
  value: number;
}

export interface CreateInsuranceRequest {
  user_id: string;
  policy_type: Insurance['policy_type'];
  provider: string;
  coverage_amount: number;
  annual_premium: number;
  cash_value?: number;
  beneficiary?: string;
}

export interface QueryRequest {
  user_id: string;
  question: string;
}

export interface QueryResponse {
  recommendation: string;
  sources: Array<{
    doc_name: string;
    section: string;
    url: string;
  }>;
}
