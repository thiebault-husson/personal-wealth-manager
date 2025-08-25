import React, { useState, useRef, useEffect } from 'react';
import type { Account, Position } from '@shared/types';
import { positionAPI } from '../services/api';

interface PositionFormProps {
  accounts: Account[];
  onPositionAdded: (position: Position) => void;
  positions: Position[];
  onNext: () => void;
  onSkip: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const PositionForm: React.FC<PositionFormProps> = ({
  accounts,
  onPositionAdded,
  positions,
  onNext,
  onSkip,
  isLoading,
  setIsLoading,
  setError
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Abort any pending request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const [formData, setFormData] = useState({
    account_id: accounts[0]?.id || '',
    ticker: '',
    asset_type: 'stock' as Position['asset_type'],
    quantity: 0,
    value: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create and capture controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    console.log('🚀 Submitting position:', formData);

    try {
      const position = await positionAPI.create(formData, controller.signal);
      console.log('✅ Position created:', position);
      
      // Check if request was aborted
      if (controller.signal.aborted) return;
      
      onPositionAdded(position);
      
      // Show brief success feedback
      setError(null);
      
      // Reset form for next position
      setFormData({
        account_id: formData.account_id, // Keep the same account selected for convenience
        ticker: '',
        asset_type: 'stock' as Position['asset_type'],
        quantity: 0,
        value: 0
      });
    } catch (error) {
      // Swallow AbortError and skip updates for canceled requests
      // @ts-expect-error: DOMException on some runtimes
      if ((error as any)?.name === 'AbortError' || controller.signal.aborted) {
        console.log('⚠️ Position request was aborted, skipping error handling');
        return;
      }
      
      setError(error instanceof Error ? error.message : 'Failed to create position');
    } finally {
      // Always reset loading state unless request was aborted
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="form-container">
        <h2>📈 Position Management</h2>
        <div className="empty-state">
          <p>You need to add at least one account before adding positions.</p>
          <button onClick={onSkip} className="btn-primary">
            Go Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  return (
    <div className="form-container">
      <h2>📈 Position Management</h2>
      <p>Add your investment positions and holdings. You can add multiple positions - the form will reset after each addition.</p>

      {positions.length > 0 && (
        <div className="positions-list">
          <h3>Your Positions ({positions.length})</h3>
          {positions.map((position) => (
            <div key={position.id} className="position-item">
              <div className="position-info">
                <strong>{position.ticker}</strong>
                <span className="position-type">{position.asset_type}</span>
                <span className="position-account">{getAccountName(position.account_id)}</span>
              </div>
              <div className="position-details">
                <div>{position.quantity} shares</div>
                <div className="position-value">${position.value.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="account_id">Account *</label>
          <select
            id="account_id"
            value={formData.account_id}
            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            required
            disabled={isLoading}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ticker">Ticker Symbol *</label>
            <input
              type="text"
              id="ticker"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              placeholder="e.g., AAPL, TSLA, VTSAX"
              maxLength={10}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="asset_type">Asset Type *</label>
            <select
              id="asset_type"
              value={formData.asset_type}
              onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as Position['asset_type'] })}
              required
              disabled={isLoading}
            >
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
              <option value="mutual_fund">Mutual Fund</option>
              <option value="bond">Bond</option>
              <option value="muni_bond">Municipal Bond</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity/Shares *</label>
            <input
              type="number"
              id="quantity"
              min="0.001"
              step="0.001"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="value">Total Value (USD) *</label>
            <input
              type="number"
              id="value"
              min="1"
              step="1"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Adding Position...' : '+ Add This Position'}
        </button>
      </form>

      {positions.length > 0 && (
        <div className="success-message">
          <span>✅ {positions.length} position{positions.length !== 1 ? 's' : ''} added successfully! You can add more positions above or continue to the dashboard.</span>
        </div>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          onClick={onSkip} 
          className="btn-link"
          disabled={isLoading}
        >
          {positions.length > 0 ? 'Skip adding more positions' : 'Skip for now'}
        </button>
        
        <button 
          type="button" 
          onClick={onNext} 
          className="btn-secondary"
          disabled={isLoading}
        >
          {positions.length > 0 ? 'Continue to Dashboard →' : 'Go to Dashboard (no positions)'}
        </button>
      </div>
    </div>
  );
};

export default PositionForm;
