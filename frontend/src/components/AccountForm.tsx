import React, { useState } from 'react';
import type { User, Account } from '@shared/types';
import { accountAPI } from '../services/api';
import { formatCurrency, prettifyLabel } from '../utils/format';

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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(accounts.length === 0);

  const accountTypes = [
    { value: '401k', label: '401(k)', description: 'Employer-sponsored retirement plan' },
    { value: '403b', label: '403(b)', description: 'Non-profit retirement plan' },
    { value: 'ira_traditional', label: 'Traditional IRA', description: 'Tax-deferred retirement account' },
    { value: 'ira_roth', label: 'Roth IRA', description: 'After-tax retirement account' },
    { value: 'brokerage', label: 'Brokerage Account', description: 'Taxable investment account' },
    { value: 'savings', label: 'Savings Account', description: 'High-yield savings account' },
    { value: 'checking', label: 'Checking Account', description: 'Primary banking account' },
    { value: 'hsa', label: 'HSA', description: 'Health Savings Account' },
    { value: 'other', label: 'Other', description: 'Other financial account' }
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Account name is required';
    }

    if (!formData.provider.trim()) {
      errors.provider = 'Provider/Institution is required';
    }

    if (formData.balance < 0) {
      errors.balance = 'Balance cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setFormErrors({});

    try {
      const account = await accountAPI.create({
        user_id: user.id,
        ...formData
      });
      onAccountAdded(account);
      
      // Reset form
      setFormData({
        name: '',
        type: '401k' as const,
        provider: '',
        balance: 0
      });
      setShowForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };



  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  };

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Add Your Accounts</h2>
        <p>Connect your financial accounts to get a complete portfolio overview</p>
      </div>

      <div className="step-body">
        {/* Existing Accounts Summary */}
        {accounts.length > 0 && (
          <div className="accounts-summary mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Your Accounts</h3>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Balance</div>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(getTotalBalance())}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="account-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="account-icon">
                        {account.type === '401k' && '🏢'}
                        {account.type === '403b' && '🏫'}
                        {account.type.includes('ira') && '🏦'}
                        {account.type === 'brokerage' && '📈'}
                        {account.type === 'savings' && '💰'}
                        {account.type === 'checking' && '💳'}
                        {account.type === 'hsa' && '🏥'}
                        {account.type === 'other' && '📊'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">
                          {accountTypes.find(t => t.value === account.type)?.label} • {account.provider}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(account.balance)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!showForm && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="btn btn-outline"
                  disabled={isLoading}
                >
                  + Add Another Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Account Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="add-account-form">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {accounts.length === 0 ? 'Add Your First Account' : 'Add Another Account'}
            </h3>

            <div className="form-section">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="account-name" className="form-label">
                    Account Name *
                  </label>
                  <input
                    id="account-name"
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., My 401k, Main Checking"
                    disabled={isLoading}
                  />
                  {formErrors.name && (
                    <div className="form-error">{formErrors.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="account-type" className="form-label">
                    Account Type
                  </label>
                  <select
                    id="account-type"
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={isLoading}
                  >
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-help">
                    {accountTypes.find(t => t.value === formData.type)?.description}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="provider" className="form-label">
                    Provider/Institution *
                  </label>
                  <input
                    id="provider"
                    type="text"
                    className={`form-input ${formErrors.provider ? 'error' : ''}`}
                    value={formData.provider}
                    onChange={(e) => handleInputChange('provider', e.target.value)}
                    placeholder="e.g., Fidelity, Chase, Vanguard"
                    disabled={isLoading}
                  />
                  {formErrors.provider && (
                    <div className="form-error">{formErrors.provider}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="balance" className="form-label">
                    Current Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="balance"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`form-input pl-8 ${formErrors.balance ? 'error' : ''}`}
                      value={formData.balance}
                      onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                  </div>
                  {formErrors.balance && (
                    <div className="form-error">{formErrors.balance}</div>
                  )}
                  <div className="form-help">Enter your current account balance</div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <span className="loading"></span>
                      Adding Account...
                    </>
                  ) : (
                    <>
                      Add Account
                    </>
                  )}
                </button>

                {accounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="step-footer">
        <div className="text-sm text-gray-500">
          Step 2 of 4 • {accounts.length} account{accounts.length !== 1 ? 's' : ''} added
        </div>
        <div className="flex gap-4">
          {accounts.length === 0 ? (
            <button
              type="button"
              onClick={onSkip}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Skip for Now
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onSkip}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Skip to Dashboard
              </button>
              <button
                type="button"
                onClick={onNext}
                className="btn btn-primary"
                disabled={isLoading}
              >
                Continue to Positions
                <span>→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountForm;