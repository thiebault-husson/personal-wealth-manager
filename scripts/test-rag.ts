#!/usr/bin/env tsx

/**
 * RAG Service Test Script
 * 
 * Tests the basic functionality of the RAG service to ensure it initializes
 * correctly and can handle basic queries.
 */

import dotenv from 'dotenv';
import { RAGService } from '../backend/src/services/ragService.js';

// Load environment variables
dotenv.config();

async function testRAGService() {
  console.log('🧪 Testing RAG Service...\n');

  try {
    // Test 1: Get RAG service instance
    console.log('1️⃣ Testing RAG service instantiation...');
    const ragService = RAGService.getInstance();
    console.log('✅ RAG service instance created\n');

    // Test 2: Initialize service
    console.log('2️⃣ Testing RAG service initialization...');
    await ragService.initialize();
    console.log('✅ RAG service initialized successfully\n');

    // Test 3: Check health
    console.log('3️⃣ Testing RAG service health check...');
    const health = await ragService.getHealth();
    console.log('📊 Health status:', health.status);
    console.log('📋 Health details:', JSON.stringify(health.details, null, 2));
    console.log('✅ Health check completed\n');

    // Test 4: Test basic query (with mock user data)
    console.log('4️⃣ Testing basic financial query...');
    const mockUser = {
      id: 'test-user',
      full_name: 'Test User',
      email: 'test@example.com',
      filing_status: 'single' as const,
      residency_state: 'CA',
      residency_city: 'San Francisco',
      age: 30,
      dependents: 0,
      risk_tolerance: 'medium' as const,
      goals: ['retirement', 'house', 'emergency fund'] as [string, string, string],
    };

    const mockAccounts = [
      {
        id: 'acc1',
        user_id: 'test-user',
        account_type: '401k' as const,
        provider: 'Fidelity',
        balance: 50000,
        currency: 'USD' as const,
      }
    ];

    const response = await ragService.queryFinancialAdvice(
      'What should I do with my 401k allocation?',
      mockUser,
      mockAccounts,
      []
    );

    console.log('💬 Query response:', response.substring(0, 200) + '...');
    console.log('✅ Basic query test completed\n');

    console.log('🎉 All RAG service tests passed!');

  } catch (error) {
    console.error('❌ RAG service test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRAGService().catch(console.error);
