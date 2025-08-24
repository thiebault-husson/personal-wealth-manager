import fs from 'fs';
import path from 'path';
import { RAGService } from './ragService';

// Import pdf-parse using createRequire for CommonJS compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let pdfParse: any = null;

function initializePdfParse() {
  if (pdfParse) return pdfParse;
  
  try {
    pdfParse = require('pdf-parse');
    console.log('✅ PDF parsing library loaded successfully');
    return pdfParse;
  } catch (error) {
    console.error('❌ Failed to load PDF parsing library:', error);
    throw new Error('PDF parsing library not available. Please install pdf-parse.');
  }
}

/**
 * Document metadata interface
 */
interface DocumentMetadata {
  documentId: string;
  filename: string;
  source: string;
  category: string;
  year?: number;
  pages?: number;
  fileSize?: number;
  processedAt: string;
  [key: string]: any;
}

/**
 * Document Ingestion Service
 * 
 * Handles parsing and ingesting various document types into the RAG system.
 * Supports PDF, text, and other document formats.
 */
export class DocumentIngestionService {
  private static instance: DocumentIngestionService;
  private ragService: RAGService;

  private constructor() {
    this.ragService = RAGService.getInstance();
  }

  public static getInstance(): DocumentIngestionService {
    if (!DocumentIngestionService.instance) {
      DocumentIngestionService.instance = new DocumentIngestionService();
    }
    return DocumentIngestionService.instance;
  }

  /**
   * Ingest a single PDF document
   */
  public async ingestPDF(filePath: string, metadata?: Partial<DocumentMetadata>): Promise<void> {
    // Initialize PDF parser
    const parser = initializePdfParse();

    try {
      console.log(`📄 Processing PDF: ${path.basename(filePath)}`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read the PDF file
      const pdfBuffer = fs.readFileSync(filePath);
      console.log(`📊 PDF file size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`);

      // Parse PDF using the correct API with error handling
      const data = await parser(pdfBuffer).catch((error: any) => {
        console.error(`❌ PDF parsing error for ${path.basename(filePath)}:`, error.message);
        throw new Error(`Failed to parse PDF: ${error.message}`);
      });

      console.log(`📊 PDF Stats: ${data.numpages} pages, ${data.text.length} characters`);

      if (!data.text || data.text.length < 50) {
        console.warn(`⚠️  PDF ${path.basename(filePath)} has very little text content. Skipping.`);
        return;
      }

      // Extract metadata from filename and file stats
      const stats = fs.statSync(filePath);
      const filename = path.basename(filePath);
      const documentId = this.generateDocumentId(filename);

      // Determine document category and source from filename
      const { category, source, year } = this.categorizeDocument(filename);

      const fullMetadata: DocumentMetadata = {
        documentId,
        filename,
        source,
        category,
        year,
        pages: data.numpages,
        fileSize: stats.size,
        processedAt: new Date().toISOString(),
        ...metadata
      };

      console.log(`🏷️  Document metadata:`, {
        id: documentId,
        category,
        source,
        pages: data.numpages,
        size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`
      });

      // Clean and preprocess the text
      const cleanedText = this.cleanPDFText(data.text);
      
      if (cleanedText.length < 100) {
        console.warn(`⚠️  Document ${filename} has very little clean text content (${cleanedText.length} chars). Skipping.`);
        return;
      }

      // Add to RAG system
      await this.ragService.addDocument(cleanedText, fullMetadata);

      console.log(`✅ Successfully ingested: ${filename}`);

    } catch (error) {
      console.error(`❌ Failed to ingest PDF ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Ingest all PDFs from a directory
   */
  public async ingestDirectory(directoryPath: string): Promise<void> {
    try {
      console.log(`📁 Processing directory: ${directoryPath}`);

      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory not found: ${directoryPath}`);
      }

      const files = fs.readdirSync(directoryPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

      console.log(`📋 Found ${pdfFiles.length} PDF files to process`);

      let successCount = 0;
      let errorCount = 0;

      for (const filename of pdfFiles) {
        const filePath = path.join(directoryPath, filename);
        try {
          await this.ingestPDF(filePath);
          successCount++;
          console.log(`\n`); // Add spacing between files
        } catch (error) {
          console.error(`❌ Failed to process ${filename}:`, error);
          errorCount++;
          console.log(`\n`); // Add spacing between files
        }
      }

      console.log(`🎉 Directory processing completed:`);
      console.log(`   ✅ Successfully processed: ${successCount} files`);
      console.log(`   ❌ Failed to process: ${errorCount} files`);

    } catch (error) {
      console.error(`❌ Failed to process directory ${directoryPath}:`, error);
      throw error;
    }
  }

  /**
   * Generate a unique document ID from filename
   */
  private generateDocumentId(filename: string): string {
    // Remove extension and clean up filename
    const baseName = filename.replace(/\.pdf$/i, '');
    const cleanName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return cleanName;
  }

  /**
   * Categorize document based on filename patterns
   */
  private categorizeDocument(filename: string): { category: string; source: string; year?: number } {
    const lowerFilename = filename.toLowerCase();

    // Extract year from filename
    const yearMatch = filename.match(/20\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

    // IRS documents
    if (lowerFilename.includes('irs') || lowerFilename.includes('publication')) {
      return {
        category: 'tax_regulation',
        source: 'IRS',
        year
      };
    }

    // State tax documents (NY/NYC)
    if (lowerFilename.includes('nys') || lowerFilename.includes('nyc') || lowerFilename.includes('ny-')) {
      return {
        category: 'state_tax',
        source: 'New York State',
        year
      };
    }

    // Financial planning guides
    if (lowerFilename.includes('planning') || lowerFilename.includes('playbook')) {
      return {
        category: 'financial_planning',
        source: 'Financial Institution',
        year
      };
    }

    // Tax planning
    if (lowerFilename.includes('tax') && (lowerFilename.includes('planning') || lowerFilename.includes('cheatsheet'))) {
      return {
        category: 'tax_planning',
        source: 'Financial Institution',
        year
      };
    }

    // Wealth management
    if (lowerFilename.includes('wealth') || lowerFilename.includes('merrill')) {
      return {
        category: 'wealth_management',
        source: 'Financial Institution',
        year
      };
    }

    // Default category
    return {
      category: 'general_financial',
      source: 'Unknown',
      year
    };
  }

  /**
   * Clean and preprocess PDF text
   */
  private cleanPDFText(text: string): string {
    return text
      // Remove excessive whitespace and normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove page numbers and headers/footers (common patterns)
      .replace(/^Page \d+.*$/gm, '')
      .replace(/^\d+\s*$/gm, '')
      .replace(/^Form \d+.*$/gm, '')
      // Remove excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      // Normalize spaces
      .replace(/[ \t]+/g, ' ')
      // Remove leading/trailing whitespace from each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0) // Remove empty lines
      .join('\n')
      .trim();
  }

  /**
   * Get ingestion statistics
   */
  public async getIngestionStats(): Promise<{
    totalDocuments: number;
    categories: Record<string, number>;
    sources: Record<string, number>;
  }> {
    // This would need to query the RAG service for statistics
    // For now, return a placeholder
    return {
      totalDocuments: 0,
      categories: {},
      sources: {}
    };
  }
}