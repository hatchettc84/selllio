/**
 * Document Parser Utility
 *
 * Parses various document formats (PDF, DOCX, TXT) and extracts text content
 * for use in presentation generation and AI processing.
 */

import * as pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    fileType: string;
  };
  error?: string;
}

export interface ParserOptions {
  maxLength?: number; // Maximum text length to extract (for very large documents)
  cleanWhitespace?: boolean; // Remove excess whitespace
}

/**
 * Parse a PDF document and extract text content
 */
async function parsePDF(buffer: Buffer, options?: ParserOptions): Promise<ParsedDocument> {
  try {
    const data = await pdf(buffer);

    let text = data.text;

    // Apply options
    if (options?.cleanWhitespace) {
      text = cleanText(text);
    }

    if (options?.maxLength && text.length > options.maxLength) {
      text = text.substring(0, options.maxLength) + '...';
    }

    const wordCount = countWords(text);

    return {
      text,
      metadata: {
        pageCount: data.numpages,
        wordCount,
        characterCount: text.length,
        fileType: 'pdf',
      },
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        fileType: 'pdf',
      },
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
    };
  }
}

/**
 * Parse a DOCX document and extract text content
 */
async function parseDOCX(buffer: Buffer, options?: ParserOptions): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    let text = result.value;

    // Log any warnings from mammoth
    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }

    // Apply options
    if (options?.cleanWhitespace) {
      text = cleanText(text);
    }

    if (options?.maxLength && text.length > options.maxLength) {
      text = text.substring(0, options.maxLength) + '...';
    }

    const wordCount = countWords(text);

    return {
      text,
      metadata: {
        wordCount,
        characterCount: text.length,
        fileType: 'docx',
      },
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        fileType: 'docx',
      },
      error: error instanceof Error ? error.message : 'Failed to parse DOCX',
    };
  }
}

/**
 * Parse a plain text document
 */
function parseTXT(buffer: Buffer, options?: ParserOptions): ParsedDocument {
  try {
    let text = buffer.toString('utf-8');

    // Apply options
    if (options?.cleanWhitespace) {
      text = cleanText(text);
    }

    if (options?.maxLength && text.length > options.maxLength) {
      text = text.substring(0, options.maxLength) + '...';
    }

    const wordCount = countWords(text);

    return {
      text,
      metadata: {
        wordCount,
        characterCount: text.length,
        fileType: 'txt',
      },
    };
  } catch (error) {
    console.error('TXT parsing error:', error);
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        fileType: 'txt',
      },
      error: error instanceof Error ? error.message : 'Failed to parse TXT',
    };
  }
}

/**
 * Main document parser function
 * Automatically detects file type and uses appropriate parser
 */
export async function parseDocument(
  buffer: Buffer,
  fileType: string,
  options?: ParserOptions
): Promise<ParsedDocument> {
  const normalizedType = fileType.toLowerCase().replace(/^\./, '');

  switch (normalizedType) {
    case 'pdf':
      return await parsePDF(buffer, options);

    case 'docx':
    case 'doc':
      return await parseDOCX(buffer, options);

    case 'txt':
    case 'text':
    case 'md':
    case 'markdown':
      return parseTXT(buffer, options);

    default:
      return {
        text: '',
        metadata: {
          wordCount: 0,
          characterCount: 0,
          fileType: normalizedType,
        },
        error: `Unsupported file type: ${normalizedType}. Supported types: PDF, DOCX, TXT, MD`,
      };
  }
}

/**
 * Validate if a file type is supported
 */
export function isSupportedFileType(fileType: string): boolean {
  const normalized = fileType.toLowerCase().replace(/^\./, '');
  const supported = ['pdf', 'docx', 'doc', 'txt', 'text', 'md', 'markdown'];
  return supported.includes(normalized);
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(fileExtension: string): string {
  const ext = fileExtension.toLowerCase().replace(/^\./, '');

  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'text': 'text/plain',
    'md': 'text/markdown',
    'markdown': 'text/markdown',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Validate file size (max 10MB by default)
 */
export function validateFileSize(
  sizeInBytes: number,
  maxSizeInMB: number = 10
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeInMB * 1024 * 1024;

  if (sizeInBytes > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeInMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Clean excess whitespace from text
 */
function cleanText(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/  +/g, ' ')
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace from start and end of lines
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Trim overall
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  return words.length;
}

/**
 * Extract metadata from filename
 */
export function extractFileMetadata(filename: string) {
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : '';

  return {
    fullName: filename,
    name,
    extension,
    mimeType: getMimeType(extension),
  };
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract key sections from parsed text (for better AI processing)
 */
export function extractSections(text: string): {
  introduction?: string;
  mainContent: string;
  conclusion?: string;
} {
  const lines = text.split('\n');
  const totalLines = lines.length;

  // Simple heuristic: first 10% is intro, last 10% is conclusion
  const introEndIndex = Math.floor(totalLines * 0.1);
  const conclusionStartIndex = Math.floor(totalLines * 0.9);

  return {
    introduction: lines.slice(0, introEndIndex).join('\n').trim(),
    mainContent: lines.slice(introEndIndex, conclusionStartIndex).join('\n').trim(),
    conclusion: lines.slice(conclusionStartIndex).join('\n').trim(),
  };
}
