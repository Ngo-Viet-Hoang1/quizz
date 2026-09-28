/**
 * Input & Output sanitizer for AI Generation
 * Implements Layer 1 (Anti-obfuscation / Input normalization) and Layer 4 (Post-generation verification)
 */

export class InputSanitizer {
  /**
   * Normalizes and cleans user input topic
   * - Strips invisible and zero-width characters
   * - Normalizes Unicode homoglyphs (NFKC)
   * - Decodes URL-encoded & Base64-obfuscated content
   * - Escapes XML delimiters to prevent sandbox breakout
   */
  static sanitizeTopic(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // 1. Strip invisible / zero-width / control characters (except standard newlines/tabs)
    let cleaned = Array.from(input)
      .filter((char) => {
        const code = char.charCodeAt(0);
        if (code >= 0x200b && code <= 0x200d) return false;
        if (code === 0xfeff) return false;
        if (code === 9 || code === 10 || code === 13) return true;
        if (code <= 31 || (code >= 127 && code <= 159)) return false;
        return true;
      })
      .join('');

    // 2. Normalize Unicode (NFKC combines homoglyphs, full-width characters, math fonts)
    cleaned = cleaned.normalize('NFKC');

    // 3. Decode URL encoding if present (e.g. %20, %3C)
    if (/%[0-9a-fA-F]{2}/.test(cleaned)) {
      try {
        cleaned = decodeURIComponent(cleaned);
      } catch {
        // Keep original if decoding fails
      }
    }

    // 4. Decode full-string Base64 if the user passed an encoded prompt
    const trimmed = cleaned.trim();
    if (this.isLikelyBase64(trimmed)) {
      try {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
        // If decoded result is valid readable text (ASCII/Unicode without control chars)
        if (decoded && /^[\p{L}\p{N}\p{P}\p{Z}\p{S}\n\r\t]+$/u.test(decoded)) {
          cleaned = decoded;
        }
      } catch {
        // Fallback to original
      }
    }

    // 5. Prevent XML boundary injection (escape user_topic closing tags)
    cleaned = cleaned
      .replace(/<\/?user_topic>/gi, '')
      .replace(/<\/?system>/gi, '')
      .replace(/<\/?instructions?>/gi, '');

    return cleaned.trim();
  }

  /**
   * Scans generated question text for malicious payloads / XSS / dangerous schemes
   */
  static validateGeneratedContent(text: string): boolean {
    if (!text || typeof text !== 'string') return true;

    // Reject dangerous script tags, event handlers, or executable protocols
    const dangerousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /<iframe[\s\S]*?>/i,
      /<embed[\s\S]*?>/i,
      /<object[\s\S]*?>/i,
      /\bon\w+\s*=/i, // inline event handlers: onerror=, onclick=
      /javascript\s*:/i,
      /vbscript\s*:/i,
      /data\s*:\s*text\/html/i,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(text));
  }

  private static isLikelyBase64(str: string): boolean {
    if (str.length < 16 || str.length % 4 !== 0) return false;
    // Base64 pattern with padding check
    return /^[A-Za-z0-9+/]+={0,2}$/.test(str);
  }
}
