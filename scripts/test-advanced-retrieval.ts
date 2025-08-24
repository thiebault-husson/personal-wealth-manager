#!/usr/bin/env tsx

/**
 * Advanced Retrieval Test Script
 * 
 * Tests the hybrid search (vector + keyword) and MMR functionality
 * to ensure high-quality document retrieval.
 */

import dotenv from 'dotenv';
import { RAGService } from '../backend/src/services/ragService';

// Load environment variables
dotenv.config();

async function testAdvancedRetrieval() {
  console.log('🔍 Testing Advanced Retrieval System...\n');

  try {
    // 1. Initialize RAG service
    console.log('1️⃣ Initializing RAG service...');
    const ragService = RAGService.getInstance();
    await ragService.initialize();
    console.log('✅ RAG service initialized\n');

    // 2. Add test documents with diverse content
    console.log('2️⃣ Adding test financial documents...');
    
    const testDocuments = [
      {
        content: `
# IRA Contribution Limits 2024

## Traditional and Roth IRA Limits
For 2024, the contribution limit for both Traditional and Roth IRAs is $7,000.

### Catch-up Contributions
Individuals age 50 and older can make additional catch-up contributions of $1,000, bringing their total to $8,000.

### Income Limits for Roth IRA
- Single filers: Phase-out range $138,000 - $153,000
- Married filing jointly: Phase-out range $218,000 - $228,000
        `,
        metadata: {
          documentId: 'ira-limits-2024',
          source: 'IRS',
          category: 'retirement',
          year: 2024
        }
      },
      {
        content: `
# 401(k) Plan Contribution Limits

## 2024 Contribution Limits
| Type | Limit | Age 50+ Catch-up |
|------|-------|------------------|
| Employee deferrals | $23,000 | +$7,500 |
| Total contributions | $69,000 | +$7,500 |

## Employer Matching
Most employers match 50-100% of employee contributions up to 3-6% of salary.

### Vesting Schedules
- Immediate: 100% vested immediately
- Graded: 20% per year over 5 years
- Cliff: 100% after 3 years
        `,
        metadata: {
          documentId: '401k-limits-2024',
          source: 'IRS',
          category: 'retirement',
          year: 2024,
          hasTable: true
        }
      },
      {
        content: `
# Tax Deductions and Credits

## Standard Deduction 2024
- Single: $14,600
- Married Filing Jointly: $29,200
- Head of Household: $21,900

## Itemized Deductions
Common itemized deductions include:
- State and local taxes (SALT): $10,000 limit
- Mortgage interest: Up to $750,000 loan balance
- Charitable contributions: Various limits based on AGI
- Medical expenses: Exceeding 7.5% of AGI

## Tax Credits
- Child Tax Credit: $2,000 per qualifying child
- Earned Income Tax Credit: Varies by income and family size
        `,
        metadata: {
          documentId: 'tax-deductions-2024',
          source: 'IRS',
          category: 'taxes',
          year: 2024,
          hasFormula: true
        }
      }
    ];

    for (const doc of testDocuments) {
      await ragService.addDocument(doc.content, doc.metadata);
      console.log(`   ✅ Added document: ${doc.metadata.documentId}`);
    }
    console.log('\n');

    // 3. Test basic retrieval
    console.log('3️⃣ Testing basic document retrieval...');
    const basicResults = await ragService.retrieveDocuments(
      "What are the IRA contribution limits?",
      {},
      3
    );
    
    console.log(`📊 Retrieved ${basicResults.length} documents:`);
    basicResults.forEach((result, index) => {
      console.log(`   ${index + 1}. Score: ${(result.score * 100).toFixed(1)}%, Source: ${result.source}`);
      console.log(`      Content: "${result.content.substring(0, 100)}..."`);
    });
    console.log('\n');

    // 4. Test filtered retrieval
    console.log('4️⃣ Testing filtered retrieval...');
    const filteredResults = await ragService.retrieveDocuments(
      "retirement contribution limits",
      {
        category: ['retirement'],
        hasTable: true
      },
      2
    );
    
    console.log(`📊 Filtered results (retirement + tables): ${filteredResults.length} documents`);
    filteredResults.forEach((result, index) => {
      console.log(`   ${index + 1}. Score: ${(result.score * 100).toFixed(1)}%, Category: ${result.metadata.category}`);
      console.log(`      Has Table: ${result.metadata.hasTable}`);
    });
    console.log('\n');

    // 5. Test full RAG query with retrieval
    console.log('5️⃣ Testing full RAG query with advanced retrieval...');
    
    const testUser = {
      id: 'test-user-456',
      full_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      filing_status: 'single',
      residency_state: 'NY',
      residency_city: 'New York',
      age: 35,
      dependents: 0,
      risk_tolerance: 'medium',
      goals: ['retirement', 'tax_optimization', 'emergency_fund']
    };

    const ragResponse = await ragService.queryFinancialAdvice(
      "I'm 35 and single. How much can I contribute to my IRA and 401k this year?",
      testUser,
      [],
      [],
      { category: ['retirement'] }
    );

    console.log('🤖 RAG Response:');
    console.log('─'.repeat(80));
    console.log(ragResponse);
    console.log('─'.repeat(80));
    console.log('\n');

    // 6. Test diversity with MMR
    console.log('6️⃣ Testing MMR diversity...');
    const diversityResults = await ragService.retrieveDocuments(
      "tax retirement contribution limits deductions",
      {},
      6
    );
    
    console.log(`🎯 MMR diverse results: ${diversityResults.length} documents`);
    diversityResults.forEach((result, index) => {
      console.log(`   ${index + 1}. Score: ${(result.score * 100).toFixed(1)}%, Category: ${result.metadata.category}`);
      console.log(`      Document: ${result.metadata.documentId}`);
    });

    console.log('\n🎉 All advanced retrieval tests completed successfully!');

  } catch (error) {
    console.error('❌ Advanced retrieval test failed:', error);
    process.exit(1);
  }
}

testAdvancedRetrieval();
