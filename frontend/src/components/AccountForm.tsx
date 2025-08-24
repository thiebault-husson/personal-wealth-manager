import React, { useState } from 'react';
import type { User, Account } from '@shared/types';
import { accountAPI } from '../services/api';

interface AccountFormProps {
  user: User;
  onAccountAdded: (account: Account) => void;
  accounts: Account[];
  onNext: () => void;
  onSkip: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const AccountForm: React.FC<AccountFormProps> = ({
  user,
  onAccountAdded,
  accounts,
  onNext,
  onSkip,
  isLoading,
  setIsLoading,
  setError
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '401k' as const,
    provider: '',
    balance: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const account = await accountAPI.create({
        ...formData,
        user_id: user.id,
        currency: 'USD'
      });
      onAccountAdded(account);
      
      // Reset form
      setFormData({
        name: '',
        type: '401k',
        provider: '',
        balance: 0
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>🏦 Account Management</h2>
      <p>Add your financial accounts to track your portfolio</p>

      {accounts.length > 0 && (
        <div className="accounts-list">
          <h3>Your Accounts ({accounts.length})</h3>
          {accounts.map((account) => (
            <div key={account.id} className="account-item">
              <div className="account-info">
                <strong>{account.name}</strong>
                <span className="account-type">{account.type}</span>
                <span className="account-provider">{account.provider}</span>
              </div>
              <div className="account-balance">
                ${account.balance.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="account_name">Account Name *</label>
          <input
            type="text"
            id="account_name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., My 401k, Roth IRA, Brokerage Account"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="account_type">Account Type *</label>
          <select
            id="account_type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            required
            disabled={isLoading}
          >
            <option value="401k">401(k)</option>
            <option value="403b">403(b)</option>
            <option value="ira_traditional">Traditional IRA</option>
            <option value="ira_roth">Roth IRA</option>
            <option value="brokerage">Brokerage Account</option>
            <option value="savings">Savings Account</option>
            <option value="checking">Checking Account</option>
            <option value="hsa">Health Savings Account (HSA)</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="provider">Provider/Institution *</label>
          <input
            type="text"
            id="provider"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder="e.g., Fidelity, Vanguard, Charles Schwab"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="balance">Current Balance *</label>
          <input
            type="number"
            id="balance"
            min="0"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-secondary">
          {isLoading ? 'Adding Account...' : 'Add Account'}
        </button>
      </form>

      <div className="form-actions">
        <button 
          type="button" 
          onClick={onSkip} 
          className="btn-link"
          disabled={isLoading}
        >
          Skip for now
        </button>
        
        {accounts.length > 0 && (
          <button 
            type="button" 
            onClick={onNext} 
            className="btn-primary"
            disabled={isLoading}
          >
            Continue to Positions →
          </button>
        )}
      </div>
    </div>
  );
};

export default AccountForm;
