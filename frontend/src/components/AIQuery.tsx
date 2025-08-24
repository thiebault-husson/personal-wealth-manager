import React, { useState, useRef, useEffect } from 'react';
import type { User } from '@shared/types';
import { ragAPI } from '../services/api';

interface AIQueryProps {
  user: User;
}

// Hoist static example queries to avoid re-allocation
const EXAMPLE_QUERIES = [
  "What's the best tax strategy for my situation?",
  "How should I allocate my investments based on my risk tolerance?",
  "What retirement accounts should I prioritize?",
  "Are there any tax-advantaged accounts I should consider?",
  "How can I optimize my portfolio for my age and goals?"
];

const AIQuery: React.FC<AIQueryProps> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    console.log('🚀 Starting AI query:', query);
    console.log('👤 User ID:', user.id);
    
    setIsLoading(true);
    setResponse('');

    try {
      console.log('📡 Calling RAG API...');
      // Call the actual RAG API
      const result = await ragAPI.query(user.id, query, abortControllerRef.current.signal);
      console.log('✅ RAG API response received:', result);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('⚠️ Request was aborted, skipping state update');
        return;
      }
      
      console.log('📝 Setting response:', result.response.substring(0, 100) + '...');
      setResponse(result.response);
      setQuery('');
    } catch (error) {
      console.error('❌ AI Query error:', error);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('⚠️ Request was aborted, skipping error handling');
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.log('🔧 Handling error:', errorMessage);
      
      // Handle specific error types
      if (errorMessage.includes('AI service is currently unavailable')) {
        setResponse('🔧 AI service is currently being configured. The system has financial knowledge but needs the ANTHROPIC_API_KEY to generate responses. Please check back later!');
      } else if (errorMessage.includes('Knowledge base is currently unavailable')) {
        setResponse('📚 Knowledge base is temporarily unavailable. Please try again in a moment.');
      } else {
        setResponse(`❌ Sorry, I encountered an error: ${errorMessage}. Please try again later.`);
      }
    } finally {
      // Check if request was aborted
      if (!abortControllerRef.current?.signal.aborted) {
        console.log('🏁 Setting loading to false');
        setIsLoading(false);
      }
    }
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };



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
            aria-label="Financial advice query"
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
            {EXAMPLE_QUERIES.map((example, index) => (
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
        <div className="ai-loading" aria-live="polite">
          <div className="loading-spinner"></div>
          <p>AI is analyzing your profile and generating personalized advice...</p>
        </div>
      )}

      {response && (
        <div className="ai-response" aria-live="polite">
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
