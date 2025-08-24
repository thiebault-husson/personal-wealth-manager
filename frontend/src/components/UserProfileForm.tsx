import React, { useState } from 'react';
import { User } from '../../../shared/types/index.js';
import { userAPI } from '../services/api';

interface UserProfileFormProps {
  onUserCreated: (user: User) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  onUserCreated,
  isLoading,
  setIsLoading,
  setError
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    filing_status: 'single' as const,
    residency_state: '',
    residency_city: '',
    age: 25,
    dependents: 0,
    risk_tolerance: 'medium' as const,
    goals: ['', '', '']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await userAPI.create(formData);
      onUserCreated(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...formData.goals];
    newGoals[index] = value;
    setFormData({ ...formData, goals: newGoals });
  };

  return (
    <div className="form-container">
      <h2>👤 Personal Profile</h2>
      <p>Tell us about yourself to get personalized financial advice</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="full_name">Full Name *</label>
          <input
            type="text"
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="age">Age *</label>
            <input
              type="number"
              id="age"
              min="18"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dependents">Dependents</label>
            <input
              type="number"
              id="dependents"
              min="0"
              max="20"
              value={formData.dependents}
              onChange={(e) => setFormData({ ...formData, dependents: parseInt(e.target.value) })}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="filing_status">Filing Status *</label>
          <select
            id="filing_status"
            value={formData.filing_status}
            onChange={(e) => setFormData({ ...formData, filing_status: e.target.value as any })}
            required
            disabled={isLoading}
          >
            <option value="single">Single</option>
            <option value="married_joint">Married Filing Jointly</option>
            <option value="married_separate">Married Filing Separately</option>
            <option value="head_of_household">Head of Household</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="residency_state">State *</label>
            <input
              type="text"
              id="residency_state"
              value={formData.residency_state}
              onChange={(e) => setFormData({ ...formData, residency_state: e.target.value })}
              placeholder="e.g., California"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="residency_city">City *</label>
            <input
              type="text"
              id="residency_city"
              value={formData.residency_city}
              onChange={(e) => setFormData({ ...formData, residency_city: e.target.value })}
              placeholder="e.g., San Francisco"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="risk_tolerance">Risk Tolerance *</label>
          <select
            id="risk_tolerance"
            value={formData.risk_tolerance}
            onChange={(e) => setFormData({ ...formData, risk_tolerance: e.target.value as any })}
            required
            disabled={isLoading}
          >
            <option value="low">Low - I prefer stable, predictable returns</option>
            <option value="medium">Medium - I'm comfortable with some market fluctuation</option>
            <option value="high">High - I'm willing to take risks for higher returns</option>
          </select>
        </div>

        <div className="form-group">
          <label>Financial Goals (3 required) *</label>
          {formData.goals.map((goal, index) => (
            <textarea
              key={index}
              value={goal}
              onChange={(e) => handleGoalChange(index, e.target.value)}
              placeholder={`Goal ${index + 1}: e.g., Save for retirement, Buy a house, Pay off debt`}
              rows={2}
              required
              disabled={isLoading}
            />
          ))}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Creating Profile...' : 'Create Profile & Continue'}
        </button>
      </form>
    </div>
  );
};

export default UserProfileForm;
