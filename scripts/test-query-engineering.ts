#!/usr/bin/env tsx

/**
 * Query Engineering Test Script
 * 
 * Tests the query expansion, user context integration, and section bias
 * functionality to ensure personalized, high-quality retrieval.
 */

import dotenv from 'dotenv';
import { RAGService } from '../backend/src/services/ragService';

// Load environment variables
dotenv.config();

async function testQueryEngineering() {
  console.log('🧠 Testing Query Engineering System...\n');

  try {
    // 1. Initialize RAG service
    console.log('1️⃣ Initializing RAG service...');
    const ragService = RAGService.getInstance();
    await ragService.initialize();
    console.log('✅ RAG service initialized\n');

    // 2. Add comprehensive test documents
    console.log('2️⃣ Adding comprehensive test financial documents...');
    
    const testDocuments = [
      {
        content: `
# IRA Contribution Limits and Rules

## Traditional and Roth IRA Contribution Limits 2024
The contribution limit for both Traditional and Roth IRAs is $7,000 for 2024.

### Catch-up Contributions
Individuals age 50 and older can contribute an additional $1,000 in catch-up contributions, bringing their total to $8,000.

### Roth IRA Income Limits
- Single filers: Phase-out begins at $138,000, ends at $153,000
- Married filing jointly: Phase-out begins at $218,000, ends at $228,000

### Traditional IRA Deductibility
Deduction limits apply if you're covered by a workplace retirement plan:
- Single: Phase-out $77,000 - $87,000
- Married filing jointly: Phase-out $123,000 - $143,000
        `,
        metadata: {
          documentId: 'ira-comprehensive-2024',
          source: 'IRS',
          category: 'retirement',
          year: 2024,
          section: 'IRA Contribution Limits'
        }
      },
      {
        content: `
# 401(k) Plan Rules and Limits

## Employee Contribution Limits 2024
- Standard contribution limit: $23,000
- Catch-up contribution (age 50+): Additional $7,500
- Total employee maximum: $30,500

## Employer Contributions and Limits
Total contributions (employee + employer) cannot exceed:
- Under age 50: $69,000
- Age 50 and over: $76,500

### Vesting and Withdrawal Rules
- Employer contributions may have vesting schedules
- Early withdrawals before age 59½ incur 10% penalty
- Required minimum distributions begin at age 73
        `,
        metadata: {
          documentId: '401k-comprehensive-2024',
          source: 'IRS',
          category: 'retirement',
          year: 2024,
          section: '401k Contribution Limits',
          hasFormula: true
        }
      },
      {
        content: `
# Tax Deductions for Different Filing Statuses

## Standard Deduction 2024
- Single: $14,600
- Married Filing Jointly: $29,200
- Married Filing Separately: $14,600
- Head of Household: $21,900

## State Tax Considerations
### High-Tax States (CA, NY, NJ)
- State and Local Tax (SALT) deduction capped at $10,000
- Consider tax-loss harvesting strategies
- Municipal bonds may be tax-advantaged

### No-Tax States (TX, FL, WA)
- No state income tax benefit for Traditional IRA contributions
- Roth IRA may be more attractive
        `,
        metadata: {
          documentId: 'tax-deductions-filing-status-2024',
          source: 'IRS',
          category: 'taxes',
          year: 2024,
          section: 'Tax Deductions',
          subsection: 'Filing Status'
        }
      }
    ];

    for (const doc of testDocuments) {
      await ragService.addDocument(doc.content, doc.metadata);
      console.log(`   ✅ Added document: ${doc.metadata.documentId}`);
    }
    console.log('\n');

    // 3. Test basic query expansion
    console.log('3️⃣ Testing basic query expansion...');
    const basicQuery = "What's the IRA limit?";
    const testUser = {
      id: 'test-user-789',
      full_name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      filing_status: 'single',
      residency_state: 'CA',
      residency_city: 'Los Angeles',
      age: 45,
      dependents: 0,
      risk_tolerance: 'medium',
      goals: ['retirement', 'tax_optimization']
    };

    const expandedQuery = await ragService.expandQuery(basicQuery, testUser);
    
    console.log(`📝 Query Expansion Results:`);
    console.log(`   Original: "${expandedQuery.original}"`);
    console.log(`   Expanded: "${expandedQuery.expanded}"`);
    console.log(`   Expansion Terms: [${expandedQuery.expansionTerms.join(', ')}]`);
    console.log(`   User Context Terms: [${expandedQuery.userContextTerms.join(', ')}]`);
    console.log(`   Priority Sections: [${expandedQuery.prioritySections.join(', ')}]`);
    console.log('\n');

    // 4. Test enhanced retrieval with different user profiles
    console.log('4️⃣ Testing enhanced retrieval with user context...');
    
    // Young user under 50
    const youngUser = { ...testUser, age: 28 };
    const youngUserResults = await ragService.retrieveDocumentsWithExpansion(
      "How much can I contribute to retirement accounts?",
      youngUser
    );
    
    console.log(`👤 Young User (age 28) Results:`);
    console.log(`   Query expanded to: "${youngUserResults.expandedQuery.expanded}"`);
    console.log(`   Retrieved ${youngUserResults.results.length} documents with scores:`);
    youngUserResults.results.forEach((result, index) => {
      console.log(`      ${index + 1}. Score: ${(result.score * 100).toFixed(1)}% - ${result.metadata.documentId}`);
    });
    console.log('\n');

    // Older user over 50
    const olderUser = { ...testUser, age: 55 };
    const olderUserResults = await ragService.retrieveDocumentsWithExpansion(
      "How much can I contribute to retirement accounts?",
      olderUser
    );
    
    console.log(`👤 Older User (age 55) Results:`);
    console.log(`   Query expanded to: "${olderUserResults.expandedQuery.expanded}"`);
    console.log(`   Retrieved ${olderUserResults.results.length} documents with scores:`);
    olderUserResults.results.forEach((result, index) => {
      console.log(`      ${index + 1}. Score: ${(result.score * 100).toFixed(1)}% - ${result.metadata.documentId}`);
    });
    console.log('\n');

    // 5. Test full RAG with enhanced context
    console.log('5️⃣ Testing full RAG query with enhanced personalization...');
    
    const ragResponse = await ragService.queryFinancialAdvice(
      "I live in California and want to maximize my retirement savings. What should I do?",
      testUser,
      [],
      [],
      { category: ['retirement', 'taxes'] }
    );

    console.log('🤖 Enhanced RAG Response:');
    console.log('═'.repeat(100));
    console.log(ragResponse);
    console.log('═'.repeat(100));
    console.log('\n');

    // 6. Test section bias
    console.log('6️⃣ Testing section bias functionality...');
    
    const biasResults = await ragService.retrieveDocumentsWithExpansion(
      "tax deduction limits",
      testUser,
      [],
      []
    );
    
    console.log(`🎯 Section Bias Results:`);
    console.log(`   Priority sections identified: [${biasResults.expandedQuery.prioritySections.join(', ')}]`);
    biasResults.results.forEach((result, index) => {
      const isPriority = biasResults.expandedQuery.prioritySections.some(priority => 
        result.metadata.section?.toLowerCase().includes(priority.toLowerCase())
      );
      const indicator = isPriority ? '⭐ BOOSTED' : '';
      console.log(`   ${index + 1}. Score: ${(result.score * 100).toFixed(1)}% ${indicator} - Section: ${result.metadata.section || 'None'}`);
    });

    console.log('\n🎉 All query engineering tests completed successfully!');

  } catch (error) {
    console.error('❌ Query engineering test failed:', error);
    process.exit(1);
  }
}

testQueryEngineering();
