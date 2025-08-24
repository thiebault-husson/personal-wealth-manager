import React, { useState } from 'react';
import type { User } from '@shared/types';
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
    annual_income: 0,
    annual_bonus: 0,
    risk_tolerance: 'medium' as const,
    goals: ['', '', ''] as [string, string, string]
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.residency_state.trim()) {
      errors.residency_state = 'State is required';
    }

    if (!formData.residency_city.trim()) {
      errors.residency_city = 'City is required';
    }

    if (formData.age < 18 || formData.age > 100) {
      errors.age = 'Age must be between 18 and 100';
    }

    if (formData.dependents < 0 || formData.dependents > 20) {
      errors.dependents = 'Number of dependents must be between 0 and 20';
    }

    if (formData.annual_income < 0 || formData.annual_income > 10000000) {
      errors.annual_income = 'Annual income must be between $0 and $10,000,000';
    }

    if (formData.annual_bonus < 0 || formData.annual_bonus > 5000000) {
      errors.annual_bonus = 'Annual bonus must be between $0 and $5,000,000';
    }

    const filledGoals = formData.goals.filter(goal => goal.trim());
    if (filledGoals.length === 0) {
      errors.goals = 'Please provide at least one financial goal';
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
      const user = await userAPI.create(formData);
      onUserCreated(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...formData.goals] as [string, string, string];
    newGoals[index] = value;
    setFormData({ ...formData, goals: newGoals });
    
    // Clear goals error when user starts typing
    if (formErrors.goals && value.trim()) {
      const newErrors = { ...formErrors };
      delete newErrors.goals;
      setFormErrors(newErrors);
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

  const goalPlaceholders = [
    "e.g., Save for retirement",
    "e.g., Buy a house in 5 years", 
    "e.g., Build emergency fund"
  ];

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Create Your Profile</h2>
        <p>Tell us about yourself to get personalized financial advice</p>
      </div>

      <form onSubmit={handleSubmit} className="step-body">
        {/* Personal Information */}
        <div className="form-section mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="full_name" className="form-label">
                Full Name *
              </label>
              <input
                id="full_name"
                type="text"
                className={`form-input ${formErrors.full_name ? 'error' : ''}`}
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
              {formErrors.full_name && (
                <div className="form-error">{formErrors.full_name}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                className={`form-input ${formErrors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              {formErrors.email && (
                <div className="form-error">{formErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="age" className="form-label">
                Age *
              </label>
              <input
                id="age"
                type="number"
                min="18"
                max="100"
                className={`form-input ${formErrors.age ? 'error' : ''}`}
                value={formData.age}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                disabled={isLoading}
              />
              {formErrors.age && (
                <div className="form-error">{formErrors.age}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="dependents" className="form-label">
                Number of Dependents
              </label>
              <input
                id="dependents"
                type="number"
                min="0"
                max="20"
                className={`form-input ${formErrors.dependents ? 'error' : ''}`}
                value={formData.dependents}
                onChange={(e) => handleInputChange('dependents', parseInt(e.target.value))}
                disabled={isLoading}
              />
              {formErrors.dependents && (
                <div className="form-error">{formErrors.dependents}</div>
              )}
              <div className="form-help">Include children, elderly parents, or others you financially support</div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="residency_state" className="form-label">
                State *
              </label>
              <input
                id="residency_state"
                type="text"
                className={`form-input ${formErrors.residency_state ? 'error' : ''}`}
                value={formData.residency_state}
                onChange={(e) => handleInputChange('residency_state', e.target.value)}
                placeholder="e.g., California"
                disabled={isLoading}
              />
              {formErrors.residency_state && (
                <div className="form-error">{formErrors.residency_state}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="residency_city" className="form-label">
                City *
              </label>
              <input
                id="residency_city"
                type="text"
                className={`form-input ${formErrors.residency_city ? 'error' : ''}`}
                value={formData.residency_city}
                onChange={(e) => handleInputChange('residency_city', e.target.value)}
                placeholder="e.g., San Francisco"
                disabled={isLoading}
              />
              {formErrors.residency_city && (
                <div className="form-error">{formErrors.residency_city}</div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Profile */}
        <div className="form-section mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="annual_income" className="form-label">
                Annual Income *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="annual_income"
                  type="number"
                  min="0"
                  step="1000"
                  className={`form-input pl-8 ${formErrors.annual_income ? 'error' : ''}`}
                  value={formData.annual_income}
                  onChange={(e) => handleInputChange('annual_income', parseInt(e.target.value) || 0)}
                  placeholder="75000"
                  disabled={isLoading}
                />
              </div>
              {formErrors.annual_income && (
                <div className="form-error">{formErrors.annual_income}</div>
              )}
              <div className="form-help">Your gross annual salary before taxes</div>
            </div>

            <div className="form-group">
              <label htmlFor="annual_bonus" className="form-label">
                Annual Bonus (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="annual_bonus"
                  type="number"
                  min="0"
                  step="1000"
                  className={`form-input pl-8 ${formErrors.annual_bonus ? 'error' : ''}`}
                  value={formData.annual_bonus}
                  onChange={(e) => handleInputChange('annual_bonus', parseInt(e.target.value) || 0)}
                  placeholder="10000"
                  disabled={isLoading}
                />
              </div>
              {formErrors.annual_bonus && (
                <div className="form-error">{formErrors.annual_bonus}</div>
              )}
              <div className="form-help">Expected annual bonus or variable compensation</div>
            </div>

            <div className="form-group">
              <label htmlFor="filing_status" className="form-label">
                Tax Filing Status
              </label>
              <select
                id="filing_status"
                className="form-select"
                value={formData.filing_status}
                onChange={(e) => handleInputChange('filing_status', e.target.value)}
                disabled={isLoading}
              >
                <option value="single">Single</option>
                <option value="married_joint">Married Filing Jointly</option>
                <option value="married_separate">Married Filing Separately</option>
                <option value="head_of_household">Head of Household</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="risk_tolerance" className="form-label">
                Investment Risk Tolerance
              </label>
              <select
                id="risk_tolerance"
                className="form-select"
                value={formData.risk_tolerance}
                onChange={(e) => handleInputChange('risk_tolerance', e.target.value)}
                disabled={isLoading}
              >
                <option value="low">Conservative - Prefer stable, low-risk investments</option>
                <option value="medium">Moderate - Balance between growth and safety</option>
                <option value="high">Aggressive - Comfortable with high-risk, high-reward</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Goals */}
        <div className="form-section mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Goals</h3>
          <p className="text-gray-600 mb-6">Share your top financial priorities to get tailored advice</p>
          
          <div className="space-y-4">
            {formData.goals.map((goal, index) => (
              <div key={index} className="form-group">
                <label htmlFor={`goal-${index}`} className="form-label">
                  Goal {index + 1} {index === 0 && '*'}
                </label>
                <input
                  id={`goal-${index}`}
                  type="text"
                  className={`form-input ${formErrors.goals && index === 0 ? 'error' : ''}`}
                  value={goal}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  placeholder={goalPlaceholders[index]}
                  disabled={isLoading}
                />
              </div>
            ))}
            {formErrors.goals && (
              <div className="form-error">{formErrors.goals}</div>
            )}
          </div>
        </div>
      </form>

      <div className="step-footer">
        <div className="text-sm text-gray-500">
          Step 1 of 4 • All information is stored locally
        </div>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="btn btn-primary btn-lg"
        >
          {isLoading ? (
            <>
              <span className="loading"></span>
              Creating Profile...
            </>
          ) : (
            <>
              Create Profile
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserProfileForm;