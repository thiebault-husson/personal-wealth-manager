import { Anthropic } from '@anthropic-ai/sdk';
import { ChromaClient } from 'chromadb';
import { encoding_for_model } from 'tiktoken';
import type { User, Account, Position } from '../../../shared/types';

/**
 * Document chunk interface for semantic chunking
 */
interface DocumentChunk {
  content: string;
  metadata: {
    chunkId: string;
    documentId: string;
    chunkIndex: number;
    tokenCount: number;
    hasTable: boolean;
    hasFormula: boolean;
    hasNumbers: boolean;
    section?: string;
    subsection?: string;
    [key: string]: any;
  };
}

/**
 * Retrieval result interface
 */
interface RetrievalResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
  source: 'vector' | 'keyword' | 'hybrid';
}

/**
 * Retrieval filters interface
 */
interface RetrievalFilters {
  source?: string[];
  category?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  hasTable?: boolean;
  hasFormula?: boolean;
  section?: string[];
  [key: string]: any;
}

/**
 * RAG Service for Personal Wealth Manager
 * 
 * Implements retrieval-augmented generation for financial advice using:
 * - Claude Haiku for cost-effective embeddings and processing
 * - Claude Sonnet for final response generation
 * - ChromaDB for vector storage
 * - Custom semantic chunking optimized for financial documents
 */
export class RAGService {
  private static instance: RAGService;
  private anthropic: Anthropic;
  private chromaClient: ChromaClient;
  private isInitialized = false;

  // RAG Configuration
  private readonly config = {
    // Document Processing
    chunkSize: 350,           // Tokens per chunk
    chunkOverlap: 60,         // Overlap between chunks
    
    // Embeddings - Use Claude 3.5 Haiku for cost-effective embedding generation
    embeddingModel: 'claude-3-5-haiku-20241022',  // Latest Haiku model ($0.80/MTok input, $4/MTok output)
    embeddingDimensions: 384, // Standard embedding size
    
    // Retrieval
    topK: 6,                  // Number of documents to retrieve
    mmrLambda: 0.4,          // MMR diversity parameter (0.3-0.5 recommended)
    hybridAlpha: 0.7,        // Hybrid search weight (0.7 = 70% vector, 30% keyword)
    
    // Response Generation - Use Claude 3.5 Haiku for cost-effective responses
    responseModel: 'claude-3-5-haiku-20241022',   // Latest Haiku model - fastest and most cost-effective
    maxTokens: 2048,
    temperature: 0.1,         // Low for factual responses
    
    // Collections
    documentsCollection: 'financial_documents',
  };

  private constructor() {
    // Initialize Anthropic client
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Initialize ChromaDB client
    this.chromaClient = new ChromaClient({
      path: process.env.CHROMADB_URL || 'http://localhost:8000',
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Initialize the RAG service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Initializing RAG Service...');

      // Test ChromaDB connection
      await this.chromaClient.heartbeat();
      console.log('✅ ChromaDB connection successful');

      // Ensure collection exists
      await this.ensureCollectionExists();

      this.isInitialized = true;
      console.log('🚀 RAG Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RAG Service:', error);
      throw error;
    }
  }

  /**
   * Ensure the ChromaDB collection exists
   */
  private async ensureCollectionExists(): Promise<void> {
    try {
      const collections = await this.chromaClient.listCollections();
      const collectionExists = collections.some(
        col => col.name === this.config.documentsCollection
      );

      if (!collectionExists) {
        await this.chromaClient.createCollection({
          name: this.config.documentsCollection,
          metadata: {
            description: 'Financial documents for RAG system',
            created: new Date().toISOString(),
            embedding_model: this.config.embeddingModel,
          },
        });
        console.log(`📁 Created collection: ${this.config.documentsCollection}`);
      } else {
        console.log(`📁 Collection exists: ${this.config.documentsCollection}`);
      }
    } catch (error) {
      console.error('Failed to ensure collection exists:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings using Claude 3.5 Haiku (most cost-effective)
   * 
   * This method uses Claude 3.5 Haiku to extract financial concepts and create
   * semantic fingerprints for cost-effective, domain-aware embeddings.
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`🧠 Generating embedding for text (${text.length} chars) using Claude 3.5 Haiku`);
      
      // Step 1: Use Claude 3.5 Haiku to extract financial concepts
      const response = await this.anthropic.messages.create({
        model: this.config.embeddingModel,
        max_tokens: 300,
        temperature: 0, // Deterministic for consistent embeddings
        messages: [
          {
            role: 'user',
            content: `Extract the 20 most important financial concepts, terms, and themes from this text. Focus on:
- Financial products (401k, IRA, stocks, bonds, etc.)
- Tax concepts (deductions, brackets, filing status, etc.)
- Investment strategies (diversification, allocation, etc.)
- Financial metrics (APR, yield, return, etc.)
- Regulatory terms (IRS, SEC, FDIC, etc.)

Return ONLY a comma-separated list of single words or short phrases (max 3 words each).

Text: ${text.substring(0, 1000)}`
          }
        ]
      });

      // Step 2: Extract concepts from Claude's response
      const firstContent = response.content[0];
      if (!firstContent || firstContent.type !== 'text') {
        console.warn('Invalid response from Claude, using fallback embedding');
        return this.generateFallbackEmbedding(text);
      }

      const concepts = firstContent.text
        .split(',')
        .map((c: string) => c.trim().toLowerCase())
        .filter((c: string) => c.length > 0 && c.length < 50) // Filter valid concepts
        .slice(0, 20); // Top 20 concepts

      console.log(`📝 Extracted ${concepts.length} financial concepts:`, concepts.slice(0, 5).join(', '), '...');

      // Step 3: Create semantic fingerprint (384 dimensions)
      const embedding = new Array(this.config.embeddingDimensions).fill(0);
      
      // Map each concept to multiple positions in the embedding vector
      concepts.forEach((concept: string, index: number) => {
        const importance = (20 - index) / 20; // Higher importance for earlier concepts
        
        // Create multiple hash positions for each concept for better distribution
        for (let i = 0; i < 3; i++) {
          const hash = this.hashString(concept + i) % this.config.embeddingDimensions;
          embedding[hash] += importance * 0.1; // Weight by importance
        }
      });

      // Step 4: Add text characteristics for additional semantic richness
      const wordCount = text.split(/\s+/).length;
      const avgWordLength = text.replace(/\s/g, '').length / Math.max(wordCount, 1);
      const hasNumbers = /\d/.test(text);
      const hasCurrency = /\$|USD|dollar|cent/i.test(text);
      
      // Add these features to specific positions
      embedding[0] += Math.log(wordCount + 1) * 0.05;  // Document length signal
      embedding[1] += avgWordLength * 0.02;             // Complexity signal
      embedding[2] += hasNumbers ? 0.1 : 0;             // Numerical content signal
      embedding[3] += hasCurrency ? 0.1 : 0;           // Financial content signal

      // Step 5: Normalize the embedding vector
      const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
      const normalizedEmbedding = magnitude > 0 
        ? embedding.map((val: number) => val / magnitude)
        : embedding;

      console.log(`✅ Generated ${this.config.embeddingDimensions}D embedding (magnitude: ${magnitude.toFixed(4)})`);
      return normalizedEmbedding;

    } catch (error) {
      console.error('❌ Error generating embedding with Claude 3.5 Haiku:', error);
      console.log('🔄 Falling back to simple text-based embedding');
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Simple hash function for consistent concept-to-position mapping
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Fallback embedding generation when Claude API fails
   */
  private generateFallbackEmbedding(text: string): number[] {
    console.log('🔄 Generating fallback embedding using text analysis');
    
    const embedding = new Array(this.config.embeddingDimensions).fill(0);
    
    // Extract words and create simple frequency-based embedding
    const words = text.toLowerCase()
      .match(/\b\w+\b/g) || [];
    
    const uniqueWords = [...new Set(words)].slice(0, 50); // Top 50 unique words
    
    uniqueWords.forEach((word: string, index: number) => {
      const frequency = words.filter(w => w === word).length;
      const importance = frequency / words.length;
      
      // Map word to embedding positions
      for (let i = 0; i < 2; i++) {
        const hash = this.hashString(word + i) % this.config.embeddingDimensions;
        embedding[hash] += importance * (1 / Math.sqrt(index + 1));
      }
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
    return magnitude > 0 
      ? embedding.map((val: number) => val / magnitude)
      : embedding;
  }

  /**
   * Semantic Document Chunking Implementation
   * 
   * Intelligently chunks documents to preserve semantic integrity:
   * - 350 tokens per chunk with 60 token overlap
   * - Preserves tables, formulas, and numbered lists
   * - Maintains section context and hierarchy
   * - Optimized for financial document structure
   */
  public async chunkDocument(
    content: string, 
    documentId: string, 
    metadata: Record<string, any> = {}
  ): Promise<DocumentChunk[]> {
    console.log(`📄 Chunking document ${documentId} (${content.length} chars)`);
    
    try {
      // Initialize tiktoken encoder for accurate token counting
      const encoder = encoding_for_model('gpt-3.5-turbo'); // Use GPT-3.5 encoding as standard
      
      const chunks: DocumentChunk[] = [];
      let chunkIndex = 0;
      
      // Step 1: Preprocess and identify semantic boundaries
      const preprocessedContent = this.preprocessDocumentContent(content);
      const semanticBoundaries = this.identifySemanticBoundaries(preprocessedContent);
      
      // Step 2: Create chunks respecting semantic boundaries
      let currentChunk = '';
      let currentTokenCount = 0;
      let currentSection = '';
      let currentSubsection = '';
      
      const lines = preprocessedContent.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const lineTokens = encoder.encode(line).length;
        
        // Detect section headers
        const sectionMatch = line?.match(/^#+\s+(.+)$/) || line?.match(/^(\d+\.?\d*\.?\s+[A-Z][^.]*[.:]?)$/);
        if (sectionMatch) {
          if (line?.match(/^#+\s+/)) {
            currentSection = sectionMatch[1]?.trim() || '';
            currentSubsection = '';
          } else {
            currentSubsection = sectionMatch[1]?.trim() || '';
          }
        }
        
        // Check if adding this line would exceed chunk size
        const potentialTokenCount = currentTokenCount + lineTokens + 1; // +1 for newline
        
        if (potentialTokenCount > this.config.chunkSize && currentChunk.length > 0) {
          // Create chunk before adding the line that would exceed limit
          const chunk = await this.createDocumentChunk(
            currentChunk.trim(),
            documentId,
            chunkIndex,
            currentSection,
            currentSubsection,
            metadata,
            encoder
          );
          chunks.push(chunk);
          chunkIndex++;
          
          // Start new chunk with overlap
          const overlapContent = this.extractOverlapContent(currentChunk, this.config.chunkOverlap, encoder);
          currentChunk = overlapContent + (overlapContent ? '\n' : '') + line;
          currentTokenCount = encoder.encode(currentChunk).length;
        } else {
          // Add line to current chunk
          currentChunk += (currentChunk ? '\n' : '') + line;
          currentTokenCount = potentialTokenCount;
        }
        
        // Handle special semantic boundaries (tables, formulas, lists)
        if (line && this.isSemanticBoundary(line, i, lines)) {
          // Try to keep semantic units together
          const semanticUnit = this.extractSemanticUnit(lines, i);
          if (semanticUnit?.content) {
            const unitTokens = encoder.encode(semanticUnit.content).length;
            
            // If semantic unit is too large for current chunk, finalize current chunk
            if (currentTokenCount + unitTokens > this.config.chunkSize && currentChunk.length > 0) {
              const chunk = await this.createDocumentChunk(
                currentChunk.trim(),
                documentId,
                chunkIndex,
                currentSection,
                currentSubsection,
                metadata,
                encoder
              );
              chunks.push(chunk);
              chunkIndex++;
              
              // Start new chunk with the semantic unit
              const overlapContent = this.extractOverlapContent(currentChunk, this.config.chunkOverlap, encoder);
              currentChunk = overlapContent + (overlapContent ? '\n' : '') + semanticUnit.content;
              currentTokenCount = encoder.encode(currentChunk).length;
            }
            
            // Skip the lines we've already processed
            i += semanticUnit.linesProcessed - 1;
          }
        }
      }
      
      // Handle remaining content
      if (currentChunk.trim().length > 0) {
        const chunk = await this.createDocumentChunk(
          currentChunk.trim(),
          documentId,
          chunkIndex,
          currentSection,
          currentSubsection,
          metadata,
          encoder
        );
        chunks.push(chunk);
      }
      
      console.log(`✅ Created ${chunks.length} semantic chunks for document ${documentId}`);
      return chunks;
      
    } catch (error) {
      console.error('❌ Error chunking document:', error);
      // Fallback to simple chunking
      return this.fallbackChunking(content, documentId, metadata);
    }
  }
  
  /**
   * Preprocess document content for better chunking
   */
  private preprocessDocumentContent(content: string): string {
    return content
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Normalize whitespace but preserve structure
      .replace(/[ \t]+/g, ' ')
      // Remove excessive blank lines but keep paragraph breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  }
  
  /**
   * Identify semantic boundaries in the document
   */
  private identifySemanticBoundaries(content: string): number[] {
    const boundaries: number[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Headers (markdown or numbered)
      if (line.match(/^#+\s+/) || line.match(/^\d+\.?\d*\.?\s+[A-Z]/)) {
        boundaries.push(index);
      }
      // Table boundaries
      if (line.includes('|') && line.split('|').length >= 3) {
        boundaries.push(index);
      }
      // Formula or calculation boundaries
      if (line.match(/[=+\-*/]\s*\$?\d+/) || line.match(/\$\d+[,.]?\d*/)) {
        boundaries.push(index);
      }
      // List items
      if (line.match(/^[\s]*[-*•]\s+/) || line.match(/^[\s]*\d+\.?\s+/)) {
        boundaries.push(index);
      }
    });
    
    return [...new Set(boundaries)].sort((a, b) => a - b);
  }
  
  /**
   * Check if a line represents a semantic boundary
   */
  private isSemanticBoundary(line: string, index: number, lines: string[]): boolean {
    // Table start
    if (line.includes('|') && line.split('|').length >= 3) {
      return true;
    }
    
    // Formula or calculation
    if (line.match(/[=+\-*/]\s*\$?\d+/) || line.match(/\$\d+[,.]?\d*/)) {
      return true;
    }
    
    // List start
    if (line.match(/^[\s]*[-*•]\s+/) || line.match(/^[\s]*\d+\.?\s+/)) {
      return true;
    }
    
    // Section header
    if (line.match(/^#+\s+/) || line.match(/^\d+\.?\d*\.?\s+[A-Z]/)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Extract a complete semantic unit (table, list, formula block)
   */
  private extractSemanticUnit(lines: string[], startIndex: number): { content: string; linesProcessed: number } {
    const startLine = lines[startIndex];
    if (!startLine) {
      return { content: '', linesProcessed: 1 };
    }
    let endIndex = startIndex;
    let content = startLine;
    
    // Handle tables
    if (startLine.includes('|') && startLine.split('|').length >= 3) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line?.includes('|') && line.split('|').length >= 3) {
          content += '\n' + line;
          endIndex = i;
        } else if (line?.trim() === '') {
          // Allow one empty line in tables
          if (i + 1 < lines.length && lines[i + 1]?.includes('|')) {
            content += '\n' + line;
            endIndex = i;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
    
    // Handle numbered lists
    else if (startLine.match(/^[\s]*\d+\.?\s+/)) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line?.match(/^[\s]*\d+\.?\s+/) || (line?.match(/^[\s]+/) && line?.trim())) {
          content += '\n' + line;
          endIndex = i;
        } else if (line?.trim() === '') {
          // Allow empty lines in lists
          content += '\n' + line;
          endIndex = i;
        } else {
          break;
        }
      }
    }
    
    // Handle bullet lists
    else if (startLine.match(/^[\s]*[-*•]\s+/)) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line?.match(/^[\s]*[-*•]\s+/) || (line?.match(/^[\s]+/) && line?.trim())) {
          content += '\n' + line;
          endIndex = i;
        } else if (line?.trim() === '') {
          content += '\n' + line;
          endIndex = i;
        } else {
          break;
        }
      }
    }
    
    return {
      content: content || '',
      linesProcessed: endIndex - startIndex + 1
    };
  }
  
  /**
   * Extract overlap content from the end of a chunk
   */
  private extractOverlapContent(chunk: string, overlapTokens: number, encoder: any): string {
    const lines = chunk.split('\n');
    let overlapContent = '';
    let tokenCount = 0;
    
    // Start from the end and work backwards
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const lineTokens = encoder.encode(line).length;
      
      if (tokenCount + lineTokens <= overlapTokens) {
        overlapContent = line + (overlapContent ? '\n' + overlapContent : '');
        tokenCount += lineTokens;
      } else {
        break;
      }
    }
    
    return overlapContent;
  }
  
  /**
   * Create a document chunk with metadata
   */
  private async createDocumentChunk(
    content: string,
    documentId: string,
    chunkIndex: number,
    section: string,
    subsection: string,
    baseMetadata: Record<string, any>,
    encoder: any
  ): Promise<DocumentChunk> {
    const tokenCount = encoder.encode(content).length;
    
    // Analyze content characteristics
    const hasTable = content.includes('|') && content.split('|').length >= 6;
    const hasFormula = /[=+\-*/]\s*\$?\d+/.test(content) || /\$\d+[,.]?\d*/.test(content);
    const hasNumbers = /\d/.test(content);
    
    return {
      content,
      metadata: {
        chunkId: `${documentId}_chunk_${chunkIndex}`,
        documentId,
        chunkIndex,
        tokenCount,
        hasTable,
        hasFormula,
        hasNumbers,
        ...(section && { section }),
        ...(subsection && { subsection }),
        ...baseMetadata
      }
    };
  }
  
  /**
   * Fallback chunking when semantic chunking fails
   */
  private fallbackChunking(content: string, documentId: string, metadata: Record<string, any>): DocumentChunk[] {
    console.log('🔄 Using fallback chunking');
    
    const chunks: DocumentChunk[] = [];
    const encoder = encoding_for_model('gpt-3.5-turbo');
    
    const words = content.split(/\s+/);
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const word of words) {
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + word;
      const tokenCount = encoder.encode(testChunk).length;
      
      if (tokenCount > this.config.chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk,
          metadata: {
            chunkId: `${documentId}_fallback_${chunkIndex}`,
            documentId,
            chunkIndex,
            tokenCount: encoder.encode(currentChunk).length,
            hasTable: false,
            hasFormula: false,
            hasNumbers: /\d/.test(currentChunk),
            ...metadata
          }
        });
        
        chunkIndex++;
        currentChunk = word;
      } else {
        currentChunk = testChunk;
      }
    }
    
    // Add remaining content
    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk,
        metadata: {
          chunkId: `${documentId}_fallback_${chunkIndex}`,
          documentId,
          chunkIndex,
          tokenCount: encoder.encode(currentChunk).length,
          hasTable: false,
          hasFormula: false,
          hasNumbers: /\d/.test(currentChunk),
          ...metadata
        }
      });
    }
    
    return chunks;
  }

  /**
   * Advanced document retrieval using hybrid search with MMR
   * 
   * Combines vector similarity search with BM25 keyword matching,
   * then applies Maximal Marginal Relevance for diversity.
   */
  public async retrieveDocuments(
    query: string,
    filters: RetrievalFilters = {},
    topK: number = this.config.topK
  ): Promise<RetrievalResult[]> {
    await this.initialize();

    try {
      console.log(`🔍 Retrieving documents for query: "${query}"`);

      // Step 1: Vector similarity search
      const vectorResults = await this.vectorSearch(query, filters, Math.min(topK * 2, 20));
      console.log(`📊 Vector search returned ${vectorResults.length} results`);

      // Step 2: BM25 keyword search
      const keywordResults = await this.keywordSearch(query, filters, Math.min(topK * 2, 20));
      console.log(`🔤 Keyword search returned ${keywordResults.length} results`);

      // Step 3: Hybrid fusion (RRF - Reciprocal Rank Fusion)
      const hybridResults = this.fuseResults(vectorResults, keywordResults, this.config.hybridAlpha);
      console.log(`🔗 Hybrid fusion created ${hybridResults.length} combined results`);

      // Step 4: Apply MMR for diversity
      const diverseResults = this.applyMMR(hybridResults, topK, this.config.mmrLambda);
      console.log(`✨ MMR selected ${diverseResults.length} diverse results`);

      return diverseResults;

    } catch (error) {
      console.error('❌ Document retrieval failed:', error);
      throw new Error(`Failed to retrieve documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Vector similarity search using Claude embeddings
   */
  private async vectorSearch(
    query: string,
    filters: RetrievalFilters,
    topK: number
  ): Promise<RetrievalResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Build ChromaDB where clause from filters
    const whereClause = this.buildWhereClause(filters);

    // Query ChromaDB
    const collection = await this.chromaClient.getCollection({
      name: this.config.documentsCollection
    });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      ...(whereClause && { where: whereClause }),
      include: ['documents', 'metadatas', 'distances']
    });

    // Convert to RetrievalResult format
    const retrievalResults: RetrievalResult[] = [];
    
    if (results.documents && results.documents[0] && results.metadatas && results.metadatas[0] && results.distances && results.distances[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        const document = results.documents[0][i];
        const metadata = results.metadatas[0][i];
        const distance = results.distances[0][i];

        if (document && metadata && distance !== undefined && distance !== null) {
          // Convert distance to similarity score (1 - normalized distance)
          const similarity = Math.max(0, 1 - distance);
          
          retrievalResults.push({
            content: document,
            metadata: metadata as Record<string, any>,
            score: similarity,
            source: 'vector'
          });
        }
      }
    }

    return retrievalResults;
  }

  /**
   * BM25 keyword search implementation
   * 
   * Simple BM25-like scoring based on term frequency and document frequency.
   * For production, consider using a dedicated search engine like Elasticsearch.
   */
  private async keywordSearch(
    query: string,
    filters: RetrievalFilters,
    topK: number
  ): Promise<RetrievalResult[]> {
    // Get all documents from collection
    const collection = await this.chromaClient.getCollection({
      name: this.config.documentsCollection
    });

    const whereClause = this.buildWhereClause(filters);

    // Retrieve all documents (or a large subset)
    const allResults = await collection.get({
      ...(whereClause && { where: whereClause }),
      include: ['documents', 'metadatas']
    });

    if (!allResults.documents || !allResults.metadatas) {
      return [];
    }

    // Tokenize query
    const queryTerms = this.tokenizeForBM25(query.toLowerCase());
    
    // Score documents using BM25-like algorithm
    const scoredResults: RetrievalResult[] = [];
    const totalDocs = allResults.documents.length;

    for (let i = 0; i < allResults.documents.length; i++) {
      const document = allResults.documents[i];
      const metadata = allResults.metadatas[i];

      if (!document || !metadata) continue;

      const docTerms = this.tokenizeForBM25(document.toLowerCase());
      const score = this.calculateBM25Score(queryTerms, docTerms, totalDocs);

      if (score > 0) {
        scoredResults.push({
          content: document,
          metadata: metadata as Record<string, any>,
          score,
          source: 'keyword'
        });
      }
    }

    // Sort by score and return top K
    return scoredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Tokenize text for BM25 scoring
   */
  private tokenizeForBM25(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(term => term.length > 2); // Filter out very short terms
  }

  /**
   * Calculate BM25-like score for a document
   */
  private calculateBM25Score(queryTerms: string[], docTerms: string[], totalDocs: number): number {
    const k1 = 1.2; // Term frequency saturation parameter
    const b = 0.75; // Length normalization parameter
    const avgDocLength = 100; // Approximate average document length

    let score = 0;
    const docLength = docTerms.length;
    const termFreqs = new Map<string, number>();

    // Calculate term frequencies in document
    for (const term of docTerms) {
      termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
    }

    // Calculate score for each query term
    for (const queryTerm of queryTerms) {
      const tf = termFreqs.get(queryTerm) || 0;
      
      if (tf > 0) {
        // Simplified BM25 formula (without IDF calculation for now)
        const normalizedTF = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
        score += normalizedTF;
      }
    }

    return score / queryTerms.length; // Normalize by query length
  }

  /**
   * Fuse vector and keyword search results using weighted combination
   */
  private fuseResults(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[],
    alpha: number // Weight for vector results (1-alpha for keyword)
  ): RetrievalResult[] {
    const resultMap = new Map<string, RetrievalResult>();

    // Add vector results
    for (const result of vectorResults) {
      const key = this.getResultKey(result);
      resultMap.set(key, {
        ...result,
        score: result.score * alpha,
        source: 'hybrid'
      });
    }

    // Add/merge keyword results
    for (const result of keywordResults) {
      const key = this.getResultKey(result);
      const existing = resultMap.get(key);
      
      if (existing) {
        // Combine scores
        existing.score += result.score * (1 - alpha);
      } else {
        // Add new result
        resultMap.set(key, {
          ...result,
          score: result.score * (1 - alpha),
          source: 'hybrid'
        });
      }
    }

    // Convert back to array and sort by combined score
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Generate a unique key for a retrieval result
   */
  private getResultKey(result: RetrievalResult): string {
    return result.metadata.chunkId || result.content.substring(0, 100);
  }

  /**
   * Apply Maximal Marginal Relevance (MMR) for result diversification
   */
  private applyMMR(
    results: RetrievalResult[],
    topK: number,
    lambda: number // Balance between relevance (lambda) and diversity (1-lambda)
  ): RetrievalResult[] {
    if (results.length <= topK) {
      return results;
    }

    const selected: RetrievalResult[] = [];
    const remaining = [...results];

    // Select the highest scoring result first
    if (remaining.length > 0) {
      const first = remaining.shift()!;
      selected.push(first);
    }

    // Select remaining results using MMR
    while (selected.length < topK && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        if (!candidate) continue;
        
        // Calculate relevance score
        const relevanceScore = candidate.score;
        
        // Calculate maximum similarity to already selected results
        let maxSimilarity = 0;
        for (const selectedResult of selected) {
          const similarity = this.calculateContentSimilarity(candidate.content, selectedResult.content);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        // MMR score: λ * relevance - (1-λ) * max_similarity
        const mmrScore = lambda * relevanceScore - (1 - lambda) * maxSimilarity;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      // Add the best candidate to selected results
      const bestCandidate = remaining.splice(bestIndex, 1)[0];
      if (bestCandidate) {
        selected.push(bestCandidate);
      }
    }

    return selected;
  }

  /**
   * Calculate content similarity between two texts (simple Jaccard similarity)
   */
  private calculateContentSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenizeForBM25(text1));
    const tokens2 = new Set(this.tokenizeForBM25(text2));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Build ChromaDB where clause from filters
   * ChromaDB requires AND conditions to be structured differently
   */
  private buildWhereClause(filters: RetrievalFilters): Record<string, any> | undefined {
    const conditions: Record<string, any>[] = [];

    if (filters.source && filters.source.length > 0) {
      conditions.push({ source: { $in: filters.source } });
    }

    if (filters.category && filters.category.length > 0) {
      conditions.push({ category: { $in: filters.category } });
    }

    if (filters.hasTable !== undefined) {
      conditions.push({ hasTable: filters.hasTable });
    }

    if (filters.hasFormula !== undefined) {
      conditions.push({ hasFormula: filters.hasFormula });
    }

    if (filters.section && filters.section.length > 0) {
      conditions.push({ section: { $in: filters.section } });
    }

    // Date range filtering (if documents have date metadata)
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        conditions.push({ date: { $gte: filters.dateRange.start } });
      }
      if (filters.dateRange.end) {
        conditions.push({ date: { $lte: filters.dateRange.end } });
      }
    }

    // Return appropriate structure based on number of conditions
    if (conditions.length === 0) {
      return undefined;
    } else if (conditions.length === 1) {
      return conditions[0];
    } else {
      return { $and: conditions };
    }
  }

  /**
   * Query the RAG system for financial advice
   * Now enhanced with advanced retrieval
   */
  public async queryFinancialAdvice(
    query: string,
    user: User,
    accounts: Account[] = [],
    positions: Position[] = [],
    filters: RetrievalFilters = {}
  ): Promise<string> {
    await this.initialize();

    try {
      console.log(`💬 Processing query: "${query}"`);

      // Step 1: Retrieve relevant documents using advanced hybrid search
      console.log('🔍 Retrieving relevant documents with hybrid search...');
      const retrievedDocs = await this.retrieveDocuments(query, filters, this.config.topK);
      
      // Step 2: Assemble user context
      const userContext = this.assembleUserContext(user, accounts, positions);

      // Step 3: Assemble retrieved context
      const retrievedContext = this.assembleRetrievedContext(retrievedDocs);

      // Step 4: Generate response using Claude with retrieved context
      console.log('🤖 Generating response with Claude using retrieved context...');
      const response = await this.anthropic.messages.create({
        model: this.config.responseModel,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: `You are a knowledgeable financial advisor. Provide advice based on the user's profile, question, and the retrieved financial knowledge.

📑 USER PROFILE:
${userContext}

📂 RELEVANT FINANCIAL KNOWLEDGE:
${retrievedContext}

🎯 USER QUESTION: ${query}

📋 INSTRUCTIONS:
- Base your answer primarily on the provided financial knowledge
- If the knowledge doesn't contain relevant information, clearly state this
- Provide specific, actionable advice when possible
- Include relevant figures, limits, or examples from the knowledge base
- Cite sources when referencing specific information
- Use clear, structured formatting with bullet points when helpful

Please provide helpful, accurate financial advice:`
          }
        ]
      });

      const firstContent = response.content[0];
      const responseText = firstContent && firstContent.type === 'text' 
        ? firstContent.text 
        : 'Unable to generate response';

      console.log('✅ RAG query completed successfully');
      return responseText;

    } catch (error) {
      console.error('❌ RAG query failed:', error);
      throw new Error('Failed to process your financial question. Please try again.');
    }
  }

  /**
   * Assemble retrieved documents into context for the LLM
   */
  private assembleRetrievedContext(retrievedDocs: RetrievalResult[]): string {
    if (retrievedDocs.length === 0) {
      return 'No relevant financial documents found in the knowledge base.';
    }

    const contextParts: string[] = [];

    retrievedDocs.forEach((doc, index) => {
      const source = doc.metadata.documentId || 'Unknown';
      const section = doc.metadata.section ? ` - ${doc.metadata.section}` : '';
      const subsection = doc.metadata.subsection ? ` > ${doc.metadata.subsection}` : '';
      const score = (doc.score * 100).toFixed(1);

      contextParts.push(`
📄 Document ${index + 1} (Score: ${score}%, Source: ${doc.source})
Source: ${source}${section}${subsection}
Content: ${doc.content.trim()}
`);
    });

    return contextParts.join('\n---\n');
  }

  /**
   * Assemble user context for personalized responses
   */
  private assembleUserContext(user: User, accounts: Account[], positions: Position[]): string {
    const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0) + 
                         positions.reduce((sum, pos) => sum + pos.value, 0);

    const context = [
      `Name: ${user.full_name}`,
      `Age: ${user.age}`,
      `Filing Status: ${user.filing_status}`,
      `Location: ${user.residency_city}, ${user.residency_state}`,
      `Risk Tolerance: ${user.risk_tolerance}`,
      `Dependents: ${user.dependents}`,
      `Financial Goals: ${user.goals.join(', ')}`,
      `Total Net Worth: $${totalNetWorth.toLocaleString()}`,
      `Number of Accounts: ${accounts.length}`,
      `Number of Investment Positions: ${positions.length}`,
    ];

    return context.join('\n');
  }

  /**
   * Add documents to the knowledge base with semantic chunking
   */
  public async addDocument(content: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.initialize();
    
    const documentId = metadata.documentId || `doc_${Date.now()}`;
    console.log(`📚 Adding document ${documentId} to knowledge base (${content.length} chars)`);
    
    try {
      // Step 1: Chunk the document semantically
      const chunks = await this.chunkDocument(content, documentId, metadata);
      console.log(`📄 Created ${chunks.length} chunks for document ${documentId}`);
      
      // Step 2: Generate embeddings for each chunk
      const embeddings: number[][] = [];
      const chunkContents: string[] = [];
      const chunkMetadata: Record<string, any>[] = [];
      const chunkIds: string[] = [];
      
      for (const chunk of chunks) {
        console.log(`🧠 Generating embedding for chunk ${chunk.metadata.chunkIndex + 1}/${chunks.length}`);
        
        const embedding = await this.generateEmbedding(chunk.content);
        
        embeddings.push(embedding);
        chunkContents.push(chunk.content);
        chunkMetadata.push(chunk.metadata);
        chunkIds.push(chunk.metadata.chunkId);
      }
      
      // Step 3: Store chunks and embeddings in ChromaDB
      const collection = await this.chromaClient.getCollection({
        name: this.config.documentsCollection
      });
      
      await collection.add({
        ids: chunkIds,
        embeddings: embeddings,
        documents: chunkContents,
        metadatas: chunkMetadata
      });
      
      console.log(`✅ Successfully added ${chunks.length} chunks to ChromaDB for document ${documentId}`);
      
    } catch (error) {
      console.error(`❌ Error adding document ${documentId}:`, error);
      throw new Error(`Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get service health status
   */
  public async getHealth(): Promise<{ status: string; details: any }> {
    try {
      await this.initialize();
      
      const collections = await this.chromaClient.listCollections();
      const targetCollection = collections.find(c => c.name === this.config.documentsCollection);
      
      return {
        status: 'healthy',
        details: {
          initialized: this.isInitialized,
          embeddingModel: this.config.embeddingModel,
          responseModel: this.config.responseModel,
          collection: targetCollection?.name || 'not found',
          chromadbConnected: true,
          config: this.config,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          initialized: this.isInitialized,
        },
      };
    }
  }
}
