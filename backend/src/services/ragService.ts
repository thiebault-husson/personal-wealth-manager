import { Anthropic } from '@anthropic-ai/sdk';
import { ChromaClient } from 'chromadb';
import type { User, Account, Position } from '../../../shared/types';

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
    topK: 5,                  // Number of documents to retrieve
    
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
   * Generate embeddings using Claude 3 Haiku (most cost-effective)
   * This is a placeholder - we'll implement the actual embedding logic in Step 5
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // TODO: Implement Claude 3 Haiku embedding generation in Step 5
    console.log(`🧠 Generating embedding for text (${text.length} chars) using Claude 3 Haiku`);
    
    // Placeholder: return a simple vector for now
    const placeholder = new Array(this.config.embeddingDimensions).fill(0)
      .map((_, i) => Math.sin(i * 0.1) * 0.1);
    
    return placeholder;
  }

  /**
   * Query the RAG system for financial advice
   * This is a basic implementation - we'll enhance it in later steps
   */
  public async queryFinancialAdvice(
    query: string,
    user: User,
    accounts: Account[] = [],
    positions: Position[] = []
  ): Promise<string> {
    await this.initialize();

    try {
      console.log(`💬 Processing query: "${query}"`);

      // Step 1: Generate query embedding (placeholder for now)
      const queryEmbedding = await this.generateEmbedding(query);

      // Step 2: Retrieve relevant documents (placeholder for now)
      console.log('🔍 Retrieving relevant documents...');
      // TODO: Implement document retrieval in Step 7

      // Step 3: Assemble user context
      const userContext = this.assembleUserContext(user, accounts, positions);

      // Step 4: Generate response using Claude Sonnet
      console.log('🤖 Generating response with Claude Sonnet...');
      const response = await this.anthropic.messages.create({
        model: this.config.responseModel,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: `You are a knowledgeable financial advisor. Please provide advice based on the user's profile and question.

USER PROFILE:
${userContext}

USER QUESTION: ${query}

Please provide helpful, accurate financial advice. If you need more specific information to give better advice, mention what additional details would be helpful.`
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
   * Add documents to the knowledge base
   * This is a placeholder - we'll implement in Step 6
   */
  public async addDocument(content: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.initialize();
    
    console.log(`📚 Adding document to knowledge base (${content.length} chars)`);
    // TODO: Implement document chunking and ingestion in Step 6
    
    console.log('✅ Document added successfully (placeholder)');
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
