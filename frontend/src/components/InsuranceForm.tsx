import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, Insurance } from '@shared/types';
import { formatCurrency } from '../utils/format';

// Strongly typed form data interface
interface InsuranceFormData {
  policy_type: Insurance['policy_type'];
  provider: string;
  coverage_amount: number;
  annual_premium: number;
  cash_value: number;
  beneficiary: string;
}

interface InsuranceFormProps {
  user: User;
  onInsuranceAdded: (insurance: Insurance) => void;
  insurance: Insurance[];
  onNext: () => void;
  onSkip: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const InsuranceForm: React.FC<InsuranceFormProps> = ({
  user,
  onInsuranceAdded,
  insurance,
  onNext,
  onSkip,
  isLoading,
  setIsLoading,
  setError
}) => {
  const [formData, setFormData] = useState<InsuranceFormData>({
    policy_type: 'term_life',
    provider: '',
    coverage_amount: 0,
    annual_premium: 0,
    cash_value: 0,
    beneficiary: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(insurance.length === 0);

  const policyTypes = [
    { 
      value: 'term_life', 
      label: 'Term Life Insurance', 
      description: 'Temporary coverage with no cash value',
      hasCashValue: false 
    },
    { 
      value: 'whole_life', 
      label: 'Whole Life Insurance', 
      description: 'Permanent coverage with cash value component',
      hasCashValue: true 
    },
    { 
      value: 'universal_life', 
      label: 'Universal Life Insurance', 
      description: 'Flexible premiums with cash value',
      hasCashValue: true 
    },
    { 
      value: 'disability', 
      label: 'Disability Insurance', 
      description: 'Income protection if unable to work',
      hasCashValue: false 
    },
    { 
      value: 'long_term_care', 
      label: 'Long-Term Care Insurance', 
      description: 'Coverage for extended care services',
      hasCashValue: false 
    },
    { 
      value: 'health', 
      label: 'Health Insurance', 
      description: 'Medical and healthcare coverage',
      hasCashValue: false 
    },
    { 
      value: 'other', 
      label: 'Other Insurance', 
      description: 'Custom insurance policy type',
      hasCashValue: false 
    }
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.provider.trim()) {
      errors.provider = 'Insurance provider is required';
    }

    if (formData.coverage_amount <= 0) {
      errors.coverage_amount = 'Coverage amount must be greater than $0';
    }

    if (formData.annual_premium < 0) {
      errors.annual_premium = 'Annual premium cannot be negative';
    }

    const selectedPolicy = policyTypes.find(p => p.value === formData.policy_type);
    if (selectedPolicy?.hasCashValue && formData.cash_value < 0) {
      errors.cash_value = 'Cash value cannot be negative';
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
      // Create insurance object with proper typing
      const selectedPolicy = policyTypes.find(p => p.value === formData.policy_type);
      const insuranceData = {
        user_id: user.id,
        policy_type: formData.policy_type,
        provider: formData.provider.trim(),
        coverage_amount: formData.coverage_amount,
        annual_premium: formData.annual_premium,
        ...(selectedPolicy?.hasCashValue && { cash_value: formData.cash_value }),
        ...(formData.beneficiary.trim() && { beneficiary: formData.beneficiary.trim() })
      };

      // For now, create a mock insurance object (until backend API is implemented)
      const newInsurance: Insurance = {
        id: uuidv4(),
        ...insuranceData
      };

      onInsuranceAdded(newInsurance);
      
      // Reset form
      setFormData({
        policy_type: 'term_life',
        provider: '',
        coverage_amount: 0,
        annual_premium: 0,
        cash_value: 0,
        beneficiary: ''
      });
      setShowForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add insurance policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = <K extends keyof InsuranceFormData>(field: K, value: InsuranceFormData[K]) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };



  const getTotalCoverage = () => {
    return insurance.reduce((sum, policy) => sum + policy.coverage_amount, 0);
  };

  const getTotalPremiums = () => {
    return insurance.reduce((sum, policy) => sum + policy.annual_premium, 0);
  };

  const getTotalCashValue = () => {
    return insurance.reduce((sum, policy) => sum + (policy.cash_value || 0), 0);
  };

  const selectedPolicy = policyTypes.find(p => p.value === formData.policy_type);
  const showCashValue = selectedPolicy?.hasCashValue;

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Insurance Policies</h2>
        <p>Add your insurance coverage to complete your financial protection profile</p>
      </div>

      <div className="step-body">
        {/* Existing Insurance Summary */}
        {insurance.length > 0 && (
          <div className="insurance-summary mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Your Insurance Portfolio</h3>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Coverage</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(getTotalCoverage())}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat-card">
                <div className="text-sm text-gray-500">Annual Premiums</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(getTotalPremiums())}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-gray-500">Total Cash Value</div>
                <div className="text-lg font-semibold text-success">
                  {formatCurrency(getTotalCashValue())}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-gray-500">Policies</div>
                <div className="text-lg font-semibold text-gray-900">
                  {insurance.length}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {insurance.map((policy) => {
                const policyType = policyTypes.find(p => p.value === policy.policy_type);
                return (
                  <div key={policy.id} className="insurance-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="insurance-icon">
                          {policy.policy_type.includes('life') && '🛡️'}
                          {policy.policy_type === 'disability' && '🏥'}
                          {policy.policy_type === 'long_term_care' && '🏠'}
                          {policy.policy_type === 'health' && '⚕️'}
                          {policy.policy_type === 'other' && '📋'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{policyType?.label}</div>
                          <div className="text-sm text-gray-500">
                            {policy.provider} • {formatCurrency(policy.annual_premium)}/year
                          </div>
                          {policy.beneficiary && (
                            <div className="text-sm text-gray-400">
                              Beneficiary: {policy.beneficiary}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(policy.coverage_amount)}
                        </div>
                        {policy.cash_value && policy.cash_value > 0 && (
                          <div className="text-sm text-success">
                            Cash Value: {formatCurrency(policy.cash_value)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!showForm && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="btn btn-outline"
                  disabled={isLoading}
                >
                  + Add Another Policy
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Insurance Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="add-insurance-form">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {insurance.length === 0 ? 'Add Your First Insurance Policy' : 'Add Another Policy'}
            </h3>

            <div className="form-section">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="policy-type" className="form-label">
                    Policy Type
                  </label>
                  <select
                    id="policy-type"
                    className="form-select"
                    value={formData.policy_type}
                    onChange={(e) => handleInputChange('policy_type', e.target.value as Insurance['policy_type'])}
                    disabled={isLoading}
                  >
                    {policyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-help">
                    {selectedPolicy?.description}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="provider" className="form-label">
                    Insurance Provider *
                  </label>
                  <input
                    id="provider"
                    type="text"
                    className={`form-input ${formErrors.provider ? 'error' : ''}`}
                    value={formData.provider}
                    onChange={(e) => handleInputChange('provider', e.target.value)}
                    placeholder="e.g., State Farm, Allstate, MetLife"
                    disabled={isLoading}
                  />
                  {formErrors.provider && (
                    <div className="form-error">{formErrors.provider}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="coverage-amount" className="form-label">
                    Coverage Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="coverage-amount"
                      type="number"
                      min="0"
                      step="1"
                      className={`form-input pl-8 ${formErrors.coverage_amount ? 'error' : ''}`}
                      value={formData.coverage_amount}
                      onChange={(e) => handleInputChange('coverage_amount', parseFloat(e.target.value) || 0)}
                      placeholder="250000"
                      disabled={isLoading}
                    />
                  </div>
                  {formErrors.coverage_amount && (
                    <div className="form-error">{formErrors.coverage_amount}</div>
                  )}
                  <div className="form-help">Total coverage/benefit amount</div>
                </div>

                <div className="form-group">
                  <label htmlFor="annual-premium" className="form-label">
                    Annual Premium
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="annual-premium"
                      type="number"
                      min="0"
                      step="1"
                      className={`form-input pl-8 ${formErrors.annual_premium ? 'error' : ''}`}
                      value={formData.annual_premium}
                      onChange={(e) => handleInputChange('annual_premium', parseFloat(e.target.value) || 0)}
                      placeholder="1200"
                      disabled={isLoading}
                    />
                  </div>
                  {formErrors.annual_premium && (
                    <div className="form-error">{formErrors.annual_premium}</div>
                  )}
                  <div className="form-help">What you pay per year for this policy</div>
                </div>

                {showCashValue && (
                  <div className="form-group">
                    <label htmlFor="cash-value" className="form-label">
                      Current Cash Value
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        id="cash-value"
                        type="number"
                        min="0"
                        step="100"
                        className={`form-input pl-8 ${formErrors.cash_value ? 'error' : ''}`}
                        value={formData.cash_value}
                        onChange={(e) => handleInputChange('cash_value', parseFloat(e.target.value) || 0)}
                        placeholder="5000"
                        disabled={isLoading}
                      />
                    </div>
                    {formErrors.cash_value && (
                      <div className="form-error">{formErrors.cash_value}</div>
                    )}
                    <div className="form-help">Current cash surrender value</div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="beneficiary" className="form-label">
                    Primary Beneficiary (Optional)
                  </label>
                  <input
                    id="beneficiary"
                    type="text"
                    className="form-input"
                    value={formData.beneficiary}
                    onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                    placeholder="e.g., Spouse, Children"
                    disabled={isLoading}
                  />
                  <div className="form-help">Who receives the benefit</div>
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
                      Adding Policy...
                    </>
                  ) : (
                    <>
                      Add Insurance Policy
                    </>
                  )}
                </button>

                {insurance.length > 0 && (
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
          Step 3 of 5 • {insurance.length} polic{insurance.length !== 1 ? 'ies' : 'y'} added
        </div>
        <div className="flex gap-4">
          {insurance.length === 0 ? (
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
                Continue to Stock Holdings
                <span>→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsuranceForm;
