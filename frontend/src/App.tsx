import { useState, useEffect } from 'react';
import type { User, Account, Position } from '@shared/types';
import { userAPI, healthAPI } from './services/api';
import UserProfileForm from './components/UserProfileForm';
import AccountForm from './components/AccountForm';
import PositionForm from './components/PositionForm';
import Dashboard from './components/Dashboard';
import AIQuery from './components/AIQuery';
import './App.css';

type AppStep = 'profile' | 'accounts' | 'positions' | 'dashboard';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<boolean>(false);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthAPI.check();
        setApiHealth(true);
      } catch (error) {
        console.error('API health check failed:', error);
        setApiHealth(false);
      }
    };
    
    checkHealth();
  }, []);

  const handleUserCreated = async (newUser: User) => {
    setUser(newUser);
    setCurrentStep('accounts');
  };

  const handleAccountAdded = (newAccount: Account) => {
    setAccounts(prev => [...prev, newAccount]);
  };

  const handlePositionAdded = (newPosition: Position) => {
    setPositions(prev => [...prev, newPosition]);
  };

  const goToStep = (step: AppStep) => {
    setCurrentStep(step);
  };

  const resetApp = () => {
    setUser(null);
    setAccounts([]);
    setPositions([]);
    setCurrentStep('profile');
    setError(null);
  };

  if (!apiHealth) {
    return (
      <div className="app">
        <div className="container">
          <div className="error-state">
            <h1>🔌 Connection Error</h1>
            <p>Unable to connect to the Personal Wealth Manager API.</p>
            <p>Please make sure the backend server is running on port 3001.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <div className="container">
            <h1>💰 Personal Wealth Manager</h1>
            <p className="subtitle">AI-powered financial advice tailored to your profile</p>
          </div>
        </header>

        <nav className="progress-nav">
          <div className="container">
            <div className="progress-steps">
              <button 
                className={`progress-step ${currentStep === 'profile' ? 'active' : ''} ${user ? 'completed' : ''}`}
                onClick={() => goToStep('profile')}
                disabled={!user && currentStep !== 'profile'}
              >
                <span className="step-number">1</span>
                <span className="step-text">Profile</span>
              </button>
              <button 
                className={`progress-step ${currentStep === 'accounts' ? 'active' : ''} ${accounts.length > 0 ? 'completed' : ''}`}
                onClick={() => goToStep('accounts')}
                disabled={!user}
              >
                <span className="step-number">2</span>
                <span className="step-text">Accounts</span>
              </button>
              <button 
                className={`progress-step ${currentStep === 'positions' ? 'active' : ''} ${positions.length > 0 ? 'completed' : ''}`}
                onClick={() => goToStep('positions')}
                disabled={accounts.length === 0}
              >
                <span className="step-number">3</span>
                <span className="step-text">Positions</span>
              </button>
              <button 
                className={`progress-step ${currentStep === 'dashboard' ? 'active' : ''}`}
                onClick={() => goToStep('dashboard')}
                disabled={!user}
              >
                <span className="step-number">4</span>
                <span className="step-text">Dashboard</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="app-main">
          <div className="container">
            {error && (
              <div className="error-message fade-in">
                <span>❌ {error}</span>
                <button className="btn btn-sm btn-secondary" onClick={() => setError(null)}>
                  Dismiss
                </button>
              </div>
            )}

            {currentStep === 'profile' && (
              <div className="step-container fade-in">
                <UserProfileForm 
                  onUserCreated={handleUserCreated}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  setError={setError}
                />
              </div>
            )}

            {currentStep === 'accounts' && user && (
              <div className="step-container fade-in">
                <AccountForm
                  user={user}
                  onAccountAdded={handleAccountAdded}
                  accounts={accounts}
                  onNext={() => goToStep('positions')}
                  onSkip={() => goToStep('dashboard')}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  setError={setError}
                />
              </div>
            )}

            {currentStep === 'positions' && (
              <div className="step-container fade-in">
                <PositionForm
                  accounts={accounts}
                  onPositionAdded={handlePositionAdded}
                  positions={positions}
                  onNext={() => goToStep('dashboard')}
                  onSkip={() => goToStep('dashboard')}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  setError={setError}
                />
              </div>
            )}

            {currentStep === 'dashboard' && user && (
              <div className="dashboard-container fade-in">
                <div className="dashboard-main">
                  <Dashboard 
                    user={user}
                    accounts={accounts}
                    positions={positions}
                  />
                </div>
                <div className="dashboard-sidebar">
                  <AIQuery user={user} />
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="app-footer">
          <div className="container">
            {user && (
              <div className="user-info">
                <span>👤 {user.full_name}</span>
                <button onClick={resetApp} className="reset-btn">
                  Start Over
                </button>
              </div>
            )}
            <p>© 2024 Personal Wealth Manager MVP</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
