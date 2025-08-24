import React, { useState } from 'react';
import type { User } from '@shared/types';

interface AIQueryProps {
  user: User;
}

const AIQuery: React.FC<AIQueryProps> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      // TODO: Implement actual AI query endpoint
      // For now, show a placeholder response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      setResponse(`🤖 AI Assistant: Thank you for your question, ${user.full_name}! 

"${query}"

I'm currently being developed to provide personalized financial advice based on your profile and portfolio. 

Based on your information:
- Age: ${user.age}
- Risk Tolerance: ${user.risk_tolerance}
- Location: ${user.residency_city}, ${user.residency_state}
- Goals: ${user.goals.join(', ')}

Once the RAG (Retrieval-Augmented Generation) system is implemented, I'll be able to provide detailed, personalized recommendations on:
- Tax optimization strategies
- Asset allocation advice
- Retirement planning
- Investment recommendations

Stay tuned for the full AI-powered experience! 🚀`);
      
      setQuery('');
    } catch (error) {
      setResponse('❌ Sorry, I encountered an error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const exampleQueries = [
    "What's the best tax strategy for my situation?",
    "How should I allocate my investments based on my risk tolerance?",
    "What retirement accounts should I prioritize?",
    "Are there any tax-advantaged accounts I should consider?",
    "How can I optimize my portfolio for my age and goals?"
  ];

  return (
    <div className="ai-query">
      <div className="ai-header">
        <h3>🤖 AI Financial Advisor</h3>
        <p>Ask me anything about your finances, taxes, or investments!</p>
      </div>

      <form onSubmit={handleSubmit} className="query-form">
        <div className="form-group">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me about tax optimization, asset allocation, retirement planning..."
            rows={3}
            disabled={isLoading}
            className="query-input"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="btn-primary"
        >
          {isLoading ? 'Thinking...' : 'Ask AI Advisor'}
        </button>
      </form>

      {!response && !isLoading && (
        <div className="example-queries">
          <h4>💡 Try asking:</h4>
          <div className="example-buttons">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleQuery(example)}
                className="example-button"
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="ai-loading">
          <div className="loading-spinner"></div>
          <p>AI is analyzing your profile and generating personalized advice...</p>
        </div>
      )}

      {response && (
        <div className="ai-response">
          <div className="response-content">
            {response.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <button 
            onClick={() => setResponse('')}
            className="btn-link"
          >
            Clear Response
          </button>
        </div>
      )}
    </div>
  );
};

export default AIQuery;
