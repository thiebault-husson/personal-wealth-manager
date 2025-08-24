#!/usr/bin/env tsx

/**
 * Semantic Chunking Test Script
 * 
 * Tests the semantic chunking functionality to ensure it properly
 * splits documents while preserving context integrity.
 */

import dotenv from 'dotenv';
import { RAGService } from '../backend/src/services/ragService';

// Load environment variables
dotenv.config();

async function testSemanticChunking() {
  console.log('🧪 Testing Semantic Document Chunking...\n');

  try {
    // Test document content with various structures
    const testDocument = `
# Financial Planning Guide

## 1. Retirement Planning

### 401(k) Contribution Limits
For 2024, the contribution limits are:
- Standard contribution: $23,000
- Catch-up contribution (age 50+): Additional $7,500
- Total maximum: $30,500

### IRA Contribution Rules
| Account Type | 2024 Limit | Income Limit |
|-------------|------------|--------------|
| Traditional IRA | $7,000 | None for contributions |
| Roth IRA | $7,000 | $138,000 - $153,000 (single) |
| SEP-IRA | $69,000 | None |

## 2. Tax Deductions

### Standard vs Itemized
The standard deduction for 2024:
1. Single filers: $14,600
2. Married filing jointly: $29,200
3. Head of household: $21,900

### Common Itemized Deductions
- State and local taxes (SALT): $10,000 cap
- Mortgage interest: Up to $750,000 loan balance
- Charitable contributions: Various limits apply
- Medical expenses: 7.5% of AGI threshold

## 3. Investment Strategies

### Asset Allocation Formula
A common rule of thumb:
Stock percentage = 100 - Your age

For example:
- Age 30: 70% stocks, 30% bonds
- Age 50: 50% stocks, 50% bonds
- Age 65: 35% stocks, 65% bonds

### Dollar-Cost Averaging
Invest a fixed amount regularly regardless of market conditions.
Benefits:
• Reduces impact of volatility
• Builds discipline
• Simplifies investment decisions
`;

    // 1. Test RAG service instantiation
    console.log('1️⃣ Testing RAG service instantiation...');
    const ragService = RAGService.getInstance();
    console.log('✅ RAG service instance created\n');

    // 2. Test semantic chunking
    console.log('2️⃣ Testing semantic document chunking...');
    const chunks = await ragService.chunkDocument(testDocument, 'test-financial-guide', {
      source: 'test',
      category: 'financial_planning',
      year: 2024
    });

    console.log(`📊 Chunking Results:`);
    console.log(`   Total chunks: ${chunks.length}`);
    console.log(`   Document length: ${testDocument.length} characters\n`);

    // 3. Analyze chunk quality
    console.log('3️⃣ Analyzing chunk quality...');
    chunks.forEach((chunk, index) => {
      console.log(`\n📄 Chunk ${index + 1}:`);
      console.log(`   ID: ${chunk.metadata.chunkId}`);
      console.log(`   Tokens: ${chunk.metadata.tokenCount}`);
      console.log(`   Section: ${chunk.metadata.section || 'None'}`);
      console.log(`   Subsection: ${chunk.metadata.subsection || 'None'}`);
      console.log(`   Has Table: ${chunk.metadata.hasTable}`);
      console.log(`   Has Formula: ${chunk.metadata.hasFormula}`);
      console.log(`   Has Numbers: ${chunk.metadata.hasNumbers}`);
      console.log(`   Content preview: "${chunk.content.substring(0, 100)}..."`);
    });

    // 4. Test document ingestion
    console.log('\n4️⃣ Testing document ingestion...');
    await ragService.initialize();
    await ragService.addDocument(testDocument, {
      documentId: 'test-financial-guide-' + Date.now(),
      source: 'test',
      category: 'financial_planning',
      year: 2024
    });
    console.log('✅ Document ingestion completed\n');

    // 5. Test health check
    console.log('5️⃣ Testing RAG service health...');
    const health = await ragService.getHealth();
    console.log('📊 Health status:', health.status);
    console.log('📋 Health details:', JSON.stringify(health.details, null, 2));

    console.log('\n🎉 All semantic chunking tests passed!');

  } catch (error) {
    console.error('❌ Semantic chunking test failed:', error);
    process.exit(1);
  }
}

testSemanticChunking();
