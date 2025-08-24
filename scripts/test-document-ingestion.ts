#!/usr/bin/env tsx

/**
 * Document Ingestion Test Script
 * 
 * Tests the document ingestion pipeline with real PDF documents.
 * Starts with a single document to validate the flow, then processes all documents.
 */

import dotenv from 'dotenv';
import path from 'path';
import { DocumentIngestionService } from '../backend/src/services/documentIngestionService';
import { RAGService } from '../backend/src/services/ragService';

// Load environment variables
dotenv.config();

async function testDocumentIngestion() {
  console.log('📚 Testing Document Ingestion Pipeline...\n');

  try {
    // 1. Initialize services
    console.log('1️⃣ Initializing services...');
    const ingestionService = DocumentIngestionService.getInstance();
    const ragService = RAGService.getInstance();
    await ragService.initialize();
    console.log('✅ Services initialized\n');

    // 2. Test single document ingestion (NYC form)
    console.log('2️⃣ Testing single document ingestion...');
    const testDocPath = '/Users/chloerojat1/Desktop/23Aug-Hackaton/rag-docs/NYC-1127-Non-Resident-form-2024.pdf';
    
    console.log(`📄 Processing test document: ${path.basename(testDocPath)}`);
    await ingestionService.ingestPDF(testDocPath);
    console.log('✅ Single document ingestion completed\n');

    // 3. Test retrieval with the ingested document
    console.log('3️⃣ Testing retrieval with ingested document...');
    const testUser = {
      id: 'test-user-nyc',
      full_name: 'John NYC Resident',
      email: 'john@example.com',
      filing_status: 'single',
      residency_state: 'NY',
      residency_city: 'New York',
      age: 35,
      dependents: 0,
      risk_tolerance: 'medium',
      goals: ['tax_optimization']
    };

    // Test NYC-specific query
    const nycQuery = "What are the requirements for NYC non-resident tax filing?";
    const retrievalResults = await ragService.retrieveDocumentsWithExpansion(
      nycQuery,
      testUser
    );

    console.log(`🔍 Query: "${nycQuery}"`);
    console.log(`📊 Retrieved ${retrievalResults.results.length} relevant documents:`);
    retrievalResults.results.forEach((result, index) => {
      console.log(`   ${index + 1}. Score: ${(result.score * 100).toFixed(1)}% - ${result.metadata.documentId}`);
      console.log(`      Category: ${result.metadata.category}, Source: ${result.metadata.source}`);
      console.log(`      Content preview: "${result.content.substring(0, 150)}..."`);
      console.log();
    });

    // 4. Test full RAG query
    console.log('4️⃣ Testing full RAG query with ingested document...');
    const ragResponse = await ragService.queryFinancialAdvice(
      nycQuery,
      testUser,
      [],
      [],
      { category: ['state_tax'] }
    );

    console.log('🤖 RAG Response:');
    console.log('═'.repeat(100));
    console.log(ragResponse);
    console.log('═'.repeat(100));
    console.log('\n');

    // 5. Get health check to see document count
    console.log('5️⃣ Checking RAG system health...');
    const health = await ragService.getHealth();
    console.log('📊 RAG System Status:', health.status);
    console.log('📋 System Details:', JSON.stringify(health.details, null, 2));

    console.log('\n🎉 Single document ingestion test completed successfully!');

    // Ask user if they want to proceed with all documents
    console.log('\n' + '─'.repeat(60));
    console.log('📁 Ready to ingest ALL documents from rag-docs directory?');
    console.log('   This will process all PDF files and may take several minutes...');
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Document ingestion test failed:', error);
    process.exit(1);
  }
}

async function ingestAllDocuments() {
  console.log('\n📁 Ingesting ALL documents from rag-docs directory...\n');

  try {
    const ingestionService = DocumentIngestionService.getInstance();
    const ragDocsPath = '/Users/chloerojat1/Desktop/23Aug-Hackaton/rag-docs';
    
    await ingestionService.ingestDirectory(ragDocsPath);
    
    console.log('\n🎉 All documents ingested successfully!');
    
    // Final health check
    const ragService = RAGService.getInstance();
    const health = await ragService.getHealth();
    console.log('\n📊 Final RAG System Status:', health.status);
    
  } catch (error) {
    console.error('❌ Bulk document ingestion failed:', error);
    process.exit(1);
  }
}

// Run the test
const args = process.argv.slice(2);
if (args.includes('--all')) {
  ingestAllDocuments();
} else {
  testDocumentIngestion();
}

export { ingestAllDocuments };
