import React from 'react';
import type { User, Account, Position } from '@shared/types';
import { formatCurrency } from '../utils/format';
import AIQuery from './AIQuery';

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

  // Calculate investments (positions + brokerage accounts)
  const investmentAccounts = accounts.filter(acc => acc.type === 'brokerage');
  const investmentAccountsValue = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalInvestments = totalPositionValue + investmentAccountsValue;

  // Group accounts by type for the table and pie chart
  const accountsByType = accounts.reduce((acc, account) => {
    let category = '';
    switch (account.type) {
      case 'checking':
      case 'savings':
        category = 'Cash';
        break;
      case '401k':
      case '403b':
      case 'ira_traditional':
      case 'ira_roth':
      case 'hsa':
        category = 'Tax Advantaged';
        break;
      case 'brokerage':
        category = 'Taxable';
        break;
      default:
        category = 'Other';
    }
    
    if (!acc[category]) {
      acc[category] = { balance: 0, count: 0 };
    }
    acc[category].balance += account.balance;
    acc[category].count++;
    return acc;
  }, {} as Record<string, { balance: number; count: number }>);

  // Calculate retirement timeline
  const currentYear = new Date().getFullYear();
  const retirementAge = 67; // Standard retirement age
  const maxAge = 100;
  const yearsToRetirement = Math.max(0, retirementAge - user.age);
  const retirementYear = currentYear + yearsToRetirement;
  const retirementYears = maxAge - retirementAge;

  // Generate timeline markers
  const timelineMarkers = [];
  for (let age = user.age; age <= maxAge; age += 10) {
    timelineMarkers.push({
      age,
      year: currentYear + (age - user.age),
      isRetirement: age === retirementAge,
      isCurrent: age === user.age
    });
  }

  // Sample income data (would come from user profile in real app)
  const totalIncome = 85000; // This would be from user data

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Portfolio Dashboard</h2>
        <p>Welcome back, {user.full_name}!</p>
      </div>

      {/* Main Dashboard Card */}
      <div className="main-dashboard-card">
        <div className="dashboard-columns">
          {/* Left Column (1/3) - Table and Pie Chart */}
          <div className="left-column">
            {/* Accounts by Type Table */}
            <div className="accounts-table">
              <h3>Account Breakdown</h3>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(accountsByType).map(([type, data]) => {
                    const percentage = totalNetWorth > 0 ? (data.balance / totalNetWorth) * 100 : 0;
                    return (
                      <tr key={type}>
                        <td>{type}</td>
                        <td>{formatCurrency(data.balance)}</td>
                        <td>{percentage.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
        </div>

            {/* Pie Chart Placeholder */}
            <div className="pie-chart-section">
              <h4>Net Worth Distribution</h4>
              <div className="pie-chart-placeholder">
                {Object.entries(accountsByType).map(([type, data]) => {
                  const percentage = totalNetWorth > 0 ? (data.balance / totalNetWorth) * 100 : 0;
                return (
                    <div key={type} className="pie-segment" style={{
                      background: `conic-gradient(from 0deg, 
                        ${type === 'Cash' ? '#4CAF50' : 
                          type === 'Tax Advantaged' ? '#2196F3' : 
                          type === 'Taxable' ? '#FF9800' : '#607D8B'} ${percentage}%, 
                        transparent ${percentage}%)`
                    }}>
                      <span>{type}: {percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
            </div>
        </div>

          {/* Right Column (2/3) - Three Rows */}
          <div className="right-column">
            {/* Row 1 - Net Worth and Investment Cards */}
            <div className="metrics-row">
              <div className="metric-card total-net-worth">
                <div className="metric-value">{formatCurrency(totalNetWorth)}</div>
                <div className="metric-label">Total Net Worth</div>
                    </div>
              <div className="metric-card investments">
                <div className="metric-value">{formatCurrency(totalInvestments)}</div>
                <div className="metric-label">Investments</div>
                  </div>
            </div>

            {/* Row 2 - Retirement Timeline */}
            <div className="timeline-row">
              <h4>Retirement Timeline</h4>
              <div className="timeline-container">
                <div className="timeline-line">
                  <div className="timeline-progress" style={{
                    width: `${(yearsToRetirement / (maxAge - user.age)) * 100}%`
                  }}></div>
                </div>
                <div className="timeline-markers">
                  {timelineMarkers.map((marker) => (
                    <div 
                      key={marker.age} 
                      className={`timeline-marker ${marker.isCurrent ? 'current' : ''} ${marker.isRetirement ? 'retirement' : ''}`}
                      style={{
                        left: `${((marker.age - user.age) / (maxAge - user.age)) * 100}%`
                      }}
                    >
                      <div className="marker-dot"></div>
                      <div className="marker-label">
                        <div>Age {marker.age}</div>
                        <div>{marker.year}</div>
                      </div>
                    </div>
                  ))}
            </div>
                <div className="retirement-info">
                  <p><strong>Projected Retirement:</strong> {retirementYear} (Age {retirementAge})</p>
                  <p><strong>Retirement Years to Fund:</strong> {retirementYears} years</p>
        </div>
            </div>
            </div>

            {/* Row 3 - Income Chart */}
            <div className="income-row">
              <h4>Total Income</h4>
              <div className="income-chart">
                <div className="income-bar" style={{
                  width: '100%',
                  background: '#4CAF50',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '16px',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {formatCurrency(totalIncome)}
            </div>
            </div>
            </div>
          </div>
        </div>
              </div>

      {/* Personal Wealth Advisor Section */}
      <div className="wealth-advisor-section">
        <h3>🤖 Ask Your Personal Wealth Advisor</h3>
        <div className="advisor-container">
          <AIQuery user={user} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
