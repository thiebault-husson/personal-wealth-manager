import React from 'react';
import { User, Account, Position } from '../../../shared/types/index.js';

interface DashboardProps {
  user: User;
  accounts: Account[];
  positions: Position[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, accounts, positions }) => {
  // Calculate totals
  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalPositionValue = positions.reduce((sum, position) => sum + position.value, 0);
  const totalNetWorth = totalAccountBalance + totalPositionValue;

  // Group positions by asset type
  const positionsByAssetType = positions.reduce((acc, position) => {
    if (!acc[position.asset_type]) {
      acc[position.asset_type] = { count: 0, value: 0 };
    }
    acc[position.asset_type].count++;
    acc[position.asset_type].value += position.value;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Portfolio Dashboard</h2>
        <p>Welcome back, {user.full_name}!</p>
      </div>

      <div className="dashboard-grid">
        {/* Portfolio Overview */}
        <div className="dashboard-card">
          <h3>💰 Portfolio Overview</h3>
          <div className="metric-grid">
            <div className="metric">
              <div className="metric-value">${totalNetWorth.toLocaleString()}</div>
              <div className="metric-label">Total Net Worth</div>
            </div>
            <div className="metric">
              <div className="metric-value">${totalAccountBalance.toLocaleString()}</div>
              <div className="metric-label">Account Balance</div>
            </div>
            <div className="metric">
              <div className="metric-value">${totalPositionValue.toLocaleString()}</div>
              <div className="metric-label">Investment Value</div>
            </div>
          </div>
        </div>

        {/* Accounts Summary */}
        <div className="dashboard-card">
          <h3>🏦 Accounts ({accounts.length})</h3>
          {accounts.length > 0 ? (
            <div className="account-summary">
              {accounts.map((account) => (
                <div key={account.id} className="summary-item">
                  <div className="summary-info">
                    <strong>{account.name}</strong>
                    <span className="summary-type">{account.type}</span>
                  </div>
                  <div className="summary-value">
                    ${account.balance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No accounts added yet</p>
            </div>
          )}
        </div>

        {/* Asset Allocation */}
        <div className="dashboard-card">
          <h3>📈 Asset Allocation</h3>
          {Object.keys(positionsByAssetType).length > 0 ? (
            <div className="asset-allocation">
              {Object.entries(positionsByAssetType).map(([assetType, data]) => {
                const percentage = totalPositionValue > 0 ? (data.value / totalPositionValue) * 100 : 0;
                return (
                  <div key={assetType} className="allocation-item">
                    <div className="allocation-info">
                      <strong>{assetType.replace('_', ' ')}</strong>
                      <span className="allocation-count">{data.count} positions</span>
                    </div>
                    <div className="allocation-value">
                      <div>${data.value.toLocaleString()}</div>
                      <div className="allocation-percentage">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No positions added yet</p>
            </div>
          )}
        </div>

        {/* Recent Positions */}
        <div className="dashboard-card">
          <h3>📊 Recent Positions</h3>
          {positions.length > 0 ? (
            <div className="positions-summary">
              {positions.slice(-5).map((position) => {
                const account = accounts.find(a => a.id === position.account_id);
                return (
                  <div key={position.id} className="summary-item">
                    <div className="summary-info">
                      <strong>{position.ticker}</strong>
                      <span className="summary-type">{position.asset_type}</span>
                      <span className="summary-account">{account?.name}</span>
                    </div>
                    <div className="summary-value">
                      <div>{position.quantity} shares</div>
                      <div>${position.value.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No positions added yet</p>
            </div>
          )}
        </div>

        {/* User Profile Summary */}
        <div className="dashboard-card">
          <h3>👤 Profile Summary</h3>
          <div className="profile-summary">
            <div className="profile-item">
              <strong>Age:</strong> {user.age}
            </div>
            <div className="profile-item">
              <strong>Location:</strong> {user.residency_city}, {user.residency_state}
            </div>
            <div className="profile-item">
              <strong>Filing Status:</strong> {user.filing_status.replace('_', ' ')}
            </div>
            <div className="profile-item">
              <strong>Risk Tolerance:</strong> {user.risk_tolerance}
            </div>
            <div className="profile-item">
              <strong>Dependents:</strong> {user.dependents}
            </div>
          </div>
        </div>

        {/* Financial Goals */}
        <div className="dashboard-card">
          <h3>🎯 Financial Goals</h3>
          <div className="goals-list">
            {user.goals.map((goal, index) => (
              <div key={index} className="goal-item">
                <span className="goal-number">{index + 1}</span>
                <span className="goal-text">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
