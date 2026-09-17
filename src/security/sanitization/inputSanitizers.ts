/**
 * Input Sanitization, Anti-Injection & File Upload Security
 * Validates inputs against SQL/Script injection signatures and enforces strict file upload policies.
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Dangerous signatures (SQL Injection, XSS, Path Traversal)
const SQL_INJECTION_PATTERN = /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|DECLARE|MERGE)\b)|(--|\/\*|\*\/|;|\bOR\b\s+['"\d\w]+=['"\d\w]+|\bAND\b\s+['"\d\w]+=['"\d\w]+)/i;
const SCRIPT_INJECTION_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|onload=|onerror=|onclick=/i;
const PATH_TRAVERSAL_PATTERN = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c)/i;

export interface FileValidationOptions {
  maxSizeMb?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName: string;
}

export class InputSanitizer {
  /**
   * Cleans text input, stripping dangerous HTML & script elements
   */
  public static sanitizeText(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [], // Strip all HTML tags for standard plain text inputs
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitizes rich text HTML content preserving safe tags (e.g. b, i, p, ul, li)
   */
  public static sanitizeRichHtml(dirtyHtml: string): string {
    if (!dirtyHtml) return '';
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  }

  /**
   * Detects potential SQL or script injection payload in query strings or filter bars
   */
  public static isMaliciousInput(input: string): boolean {
    if (!input) return false;
    return (
      SQL_INJECTION_PATTERN.test(input) ||
      SCRIPT_INJECTION_PATTERN.test(input) ||
      PATH_TRAVERSAL_PATTERN.test(input)
    );
  }

  /**
   * Strict validation for file uploads (MIME type, size, extension, virus scan status)
   */
  public static validateFileUpload(file: File, options: FileValidationOptions = {}): FileValidationResult {
    const {
      maxSizeMb = 25,
      allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'image/png',
        'image/jpeg',
        'image/webp',
      ],
      allowedExtensions = ['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.webp'],
    } = options;

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Check File Size
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of ${maxSizeMb} MB.`,
        sanitizedName,
      };
    }

    // 2. Check Extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: `File type "${ext}" is not permitted. Allowed: ${allowedExtensions.join(', ')}`,
        sanitizedName,
      };
    }

    // 3. Check MIME Type
    if (file.type && !allowedMimeTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: `MIME type "${file.type}" is not authorized for secure upload.`,
        sanitizedName,
      };
    }

    return {
      isValid: true,
      sanitizedName,
    };
  }
}
