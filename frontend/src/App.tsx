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
      <div className="app-container">
        <div className="error-state">
          <h1>🔌 Connection Error</h1>
          <p>Unable to connect to the Personal Wealth Manager API.</p>
          <p>Please make sure the backend server is running on port 3000.</p>
          <button onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>💰 Personal Wealth Manager</h1>
        <p>AI-powered financial advice tailored to your profile</p>
      </header>

      <nav className="app-nav">
        <button 
          className={currentStep === 'profile' ? 'active' : ''}
          onClick={() => goToStep('profile')}
          disabled={!user && currentStep !== 'profile'}
        >
          1. Profile
        </button>
        <button 
          className={currentStep === 'accounts' ? 'active' : ''}
          onClick={() => goToStep('accounts')}
          disabled={!user}
        >
          2. Accounts
        </button>
        <button 
          className={currentStep === 'positions' ? 'active' : ''}
          onClick={() => goToStep('positions')}
          disabled={accounts.length === 0}
        >
          3. Positions
        </button>
        <button 
          className={currentStep === 'dashboard' ? 'active' : ''}
          onClick={() => goToStep('dashboard')}
          disabled={!user}
        >
          4. Dashboard
        </button>
      </nav>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {currentStep === 'profile' && (
          <UserProfileForm 
            onUserCreated={handleUserCreated}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        )}

        {currentStep === 'accounts' && user && (
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
        )}

        {currentStep === 'positions' && (
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
        )}

        {currentStep === 'dashboard' && user && (
          <div className="dashboard-container">
            <Dashboard 
              user={user}
              accounts={accounts}
              positions={positions}
            />
            <AIQuery user={user} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        {user && (
          <div className="user-info">
            <span>👤 {user.full_name}</span>
            <button onClick={resetApp} className="reset-btn">
              Start Over
            </button>
          </div>
        )}
        <p>© 2024 Personal Wealth Manager MVP</p>
      </footer>
      </div>
  );
}

export default App;
