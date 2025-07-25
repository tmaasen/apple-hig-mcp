/**
 * Content Processor Service
 * 
 * Handles content extraction and processing using Turndown
 * for clean HTML-to-Markdown conversion and structured content organization.
 */

import TurndownService from 'turndown';
import type { HIGSection } from '../../types.js';

export interface ContentQualityMetrics {
  score: number; // 0-1, where 1 is highest quality
  length: number;
  structureScore: number;
  appleTermsScore: number;
  codeExamplesCount: number;
  imageReferencesCount: number;
  headingCount: number;
  isFallbackContent: boolean;
  extractionMethod: string;
  confidence: number;
}

export interface ProcessedContent {
  cleanedMarkdown: string;
  frontMatter: string;
  quality: ContentQualityMetrics;
  keywords: string[];
  relatedSections: string[];
}

export class ContentProcessorService {
  private turndown: TurndownService;
  private readonly appleDesignTerms = [
    'accessibility', 'animation', 'branding', 'buttons', 'color', 'controls',
    'design', 'feedback', 'gestures', 'haptics', 'icons', 'images', 'input',
    'interface', 'layout', 'materials', 'motion', 'navigation', 'presentation',
    'selection', 'status', 'system', 'typography', 'visual', 'widgets',
    'human interface guidelines', 'user experience', 'user interface',
    'touch target', 'dynamic type', 'voiceover', 'dark mode', 'light mode'
  ];

  private readonly fallbackIndicators = [
    'this page requires javascript',
    'please turn on javascript',
    'javascript is required',
    'single page application',
    'content not available',
    'loading...',
    'page not found',
    'skip navigation',
    'refresh the page to view'
  ];

  private readonly appleSPAIndicators = [
    'skip navigation',
    'current page is',
    'supported platforms',
    'change log',
    'platform considerations',
    'additional considerations for',
    'no additional considerations for'
  ];

  constructor() {
    // Configure Turndown for high-quality conversion
    this.turndown = new TurndownService({
      headingStyle: 'atx',           // Use # headers
      bulletListMarker: '-',         // Use - for lists
      codeBlockStyle: 'fenced',      // Use ``` code blocks
      fence: '```',                  // Code fence marker
      emDelimiter: '*',              // Use * for emphasis
      strongDelimiter: '**',         // Use ** for strong
      linkStyle: 'inlined',          // Inline links
      linkReferenceStyle: 'full'     // Full reference links
    });

    this.configureTurndownRules();
  }

  private configureTurndownRules(): void {
    // Remove images for MCP efficiency (as mentioned in original code)
    this.turndown.addRule('removeImages', {
      filter: 'img',
      replacement: () => ''
    });

    // Clean navigation and footer elements with proper spacing
    this.turndown.addRule('removeNavigation', {
      filter: ['nav', 'footer', 'header'],
      replacement: () => '\n\n' // Add spacing to prevent word concatenation
    });

    // Remove elements by class name with spacing
    this.turndown.addRule('removeByClass', {
      filter: (node) => {
        if (node.nodeType === 1) { // Element node
          const className = (node as Element).className;
          return typeof className === 'string' && 
                 (className.includes('navigation') || className.includes('breadcrumb'));
        }
        return false;
      },
      replacement: () => '\n' // Add line break to prevent concatenation
    });

    // Ensure proper spacing for block elements
    this.turndown.addRule('blockElementSpacing', {
      filter: ['div', 'section', 'article', 'aside', 'main'],
      replacement: (content, node) => {
        // Only add spacing if the element actually contains content
        const trimmedContent = content.trim();
        if (!trimmedContent) return '';
        
        // Check if this is likely a content container
        const element = node as Element;
        const hasContentClass = element.className && (
          element.className.includes('content') ||
          element.className.includes('section') ||
          element.className.includes('main')
        );
        
        // Add spacing around content blocks
        return hasContentClass ? `\n\n${trimmedContent}\n\n` : trimmedContent;
      }
    });

    // Preserve code blocks
    this.turndown.addRule('preserveCode', {
      filter: 'code',
      replacement: (content) => `\`${content}\``
    });

    // Smarter whitespace handling - preserve line breaks but clean up excess spaces
    this.turndown.addRule('smartWhitespace', {
      filter: (node) => node.nodeType === 3, // Text nodes
      replacement: (content) => {
        // Preserve single line breaks, collapse multiple spaces
        return content
          .replace(/[ \t]+/g, ' ') // Collapse horizontal whitespace
          .replace(/\n[ \t]+/g, '\n') // Clean up indented lines
          .replace(/[ \t]+\n/g, '\n'); // Clean up trailing spaces
      }
    });

    // Ensure headers have proper spacing
    this.turndown.addRule('headerSpacing', {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      replacement: (content, node) => {
        const level = parseInt(node.nodeName.charAt(1));
        const headerPrefix = '#'.repeat(level);
        const trimmedContent = content.trim();
        
        if (!trimmedContent) return '';
        
        // Add spacing around headers
        return `\n\n${headerPrefix} ${trimmedContent}\n\n`;
      }
    });
  }

  /**
   * Process HTML content into clean markdown with metadata
   */
  async processContent(html: string, section: HIGSection): Promise<ProcessedContent> {
    // Clean the HTML
    const cleanedHtml = this.cleanHtml(html);
    
    // Convert to markdown
    const rawMarkdown = this.turndown.turndown(cleanedHtml);
    
    // Clean and normalize markdown
    const cleanedMarkdown = this.cleanMarkdown(rawMarkdown);
    
    // Extract keywords
    const keywords = this.extractKeywords(cleanedMarkdown, section);
    
    // Find related sections (simplified)
    const relatedSections = this.extractRelatedSections(cleanedMarkdown, section);
    
    // Calculate quality metrics (pass original for better fallback detection)
    const quality = this.calculateQualityMetrics(cleanedMarkdown, rawMarkdown);
    
    // Generate front matter
    const frontMatter = this.generateFrontMatter(section, quality, keywords);
    
    return {
      cleanedMarkdown,
      frontMatter,
      quality,
      keywords,
      relatedSections
    };
  }

  private cleanHtml(html: string): string {
    let cleaned = html;
    
    // Remove script and style tags
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    
    // Remove navigation elements with spacing to prevent word concatenation
    cleaned = cleaned.replace(/<nav\b[^>]*>.*?<\/nav>/gi, ' ');
    cleaned = cleaned.replace(/<footer\b[^>]*>.*?<\/footer>/gi, ' ');
    cleaned = cleaned.replace(/<header\b[^>]*>.*?<\/header>/gi, ' ');
    
    // Remove common UI elements that aren't content
    cleaned = cleaned.replace(/class="[^"]*breadcrumb[^"]*"/gi, '');
    cleaned = cleaned.replace(/class="[^"]*navigation[^"]*"/gi, '');
    
    // Clean up multiple spaces that might have been introduced
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned;
  }

  private cleanMarkdown(markdown: string): string {
    let cleaned = markdown;
    
    // Remove JavaScript fallback content at the beginning (more aggressive pattern)
    cleaned = cleaned.replace(/^.*?this page requires javascript.*?refresh the page to view its content\.?\s*/is, '');
    
    // Also remove the standalone JavaScript warning if it appears
    cleaned = cleaned.replace(/^#\s*this page requires javascript\.?\s*please turn on javascript.*?\s*/is, '');
    
    // Remove any remaining JavaScript-related headers and content
    cleaned = cleaned.replace(/^#\s*this page requires javascript\.?\s*/gim, '');
    cleaned = cleaned.replace(/please turn on javascript.*?content\.\s*/gim, '');
    
    // Remove "Skip Navigation" and navigation elements
    cleaned = cleaned.replace(/skip navigation\s*/gi, '');
    
    // Remove Apple SPA metadata sections
    cleaned = this.removeAppleSPAMetadata(cleaned);
    
    // Clean up repeated section titles (common in Apple's SPA output)
    cleaned = this.removeRepeatedTitles(cleaned);
    
    // Clean up spacing while preserving word boundaries
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Limit to double line breaks
    cleaned = cleaned.replace(/[ \t]+$/gm, ''); // Remove trailing spaces
    cleaned = cleaned.replace(/[ \t]+/g, ' '); // Collapse multiple spaces to single space
    
    // Ensure spacing around headers
    cleaned = cleaned.replace(/([^\n])(#+\s)/g, '$1\n\n$2'); // Space before headers
    cleaned = cleaned.replace(/(#+\s[^\n]+)([^\n])/g, '$1\n\n$2'); // Space after headers
    
    // Clean up malformed links
    cleaned = cleaned.replace(/\[([^\]]*)\]\(\)/g, '$1');
    
    // Remove empty headers
    cleaned = cleaned.replace(/^#+\s*$/gm, '');
    
    // Standardize list formatting
    cleaned = cleaned.replace(/^\s*[*+]\s/gm, '- ');
    
    // Fix common word concatenation issues from Apple's SPA
    cleaned = this.fixWordConcatenation(cleaned);
    
    // Remove trailing metadata sections
    cleaned = this.removeTrailingMetadata(cleaned);
    
    return cleaned.trim();
  }

  private removeAppleSPAMetadata(content: string): string {
    let cleaned = content;
    
    // Remove "Platform considerations" sections that are just "No additional considerations"
    cleaned = cleaned.replace(/platform considerations\s*no additional considerations for.*?\./gi, '');
    
    // Remove "Current page is X" indicators
    cleaned = cleaned.replace(/current page is \w+\s*/gi, '');
    
    // Remove "Supported platforms" lists at the end
    cleaned = cleaned.replace(/supported platforms.*$/gi, '');
    
    return cleaned;
  }

  private removeRepeatedTitles(content: string): string {
    // If the title appears multiple times, keep only the first structured occurrence
    const lines = content.split('\n');
    const titleCounts = new Map<string, number>();
    
    return lines.filter(line => {
      const titleMatch = line.match(/^#+\s*(.+)$/);
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase().trim();
        const count = titleCounts.get(title) || 0;
        titleCounts.set(title, count + 1);
        
        // Keep first occurrence and any with more structure (longer headers)
        return count === 0 || line.length > 20;
      }
      return true;
    }).join('\n');
  }

  /**
   * Fix common word concatenation issues from HTML to Markdown conversion
   */
  private fixWordConcatenation(content: string): string {
    let fixed = content;
    
    // Fix concatenated sentences (lowercase letter followed by uppercase letter)
    fixed = fixed.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // Fix concatenated words with common Apple HIG terms
    const higTerms = [
      'Best practices', 'Guidelines', 'When to use', 'How to use',
      'iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS',
      'Tab bar', 'Navigation bar', 'Button', 'Picker', 'Slider',
      'Action sheet', 'Alert', 'Popover', 'Sheet',
      'Accessibility', 'VoiceOver', 'Dynamic Type',
      'SF Symbols', 'App Store'
    ];
    
    for (const term of higTerms) {
      // Only fix clear concatenation cases to avoid false positives
      const termNoSpaces = term.replace(/\s+/g, '');
      
      // Fix cases where lowercase word is concatenated before the term
      const regex = new RegExp(`([a-z]{2,})${termNoSpaces}`, 'gi');
      fixed = fixed.replace(regex, (match, prefix) => {
        // Avoid splitting compound words that should stay together
        if (prefix.length < 3) return match;
        return `${prefix} ${term}`;
      });
      
      // Fix cases where the term is concatenated before an uppercase word
      const reverseRegex = new RegExp(`${termNoSpaces}([A-Z][a-z]{2,})`, 'gi');
      fixed = fixed.replace(reverseRegex, (match) => {
        const suffixMatch = match.match(new RegExp(`${termNoSpaces}(.+)`, 'i'));
        if (suffixMatch && suffixMatch[1].length > 2) {
          return `${term} ${suffixMatch[1]}`;
        }
        return match;
      });
    }
    
    // Fix common concatenation patterns
    fixed = fixed.replace(/([a-z])\.([A-Z])/g, '$1. $2'); // Period followed by capital
    fixed = fixed.replace(/([a-z])!([A-Z])/g, '$1! $2'); // Exclamation followed by capital
    fixed = fixed.replace(/([a-z])\?([A-Z])/g, '$1? $2'); // Question mark followed by capital
    
    // Fix number concatenations
    fixed = fixed.replace(/([0-9])([A-Za-z])/g, '$1 $2'); // Number followed by letter
    fixed = fixed.replace(/([A-Za-z])([0-9])/g, '$1 $2'); // Letter followed by number
    
    return fixed;
  }

  private removeTrailingMetadata(content: string): string {
    let cleaned = content;
    
    // Remove common trailing sections
    const trailingSections = [
      'resources?\\s*related.*?change log.*$',
      'change log\\s*date\\s*changes.*$',
      'videos\\s*discoverable design.*$',
      'platform considerations.*?resources.*$'
    ];
    
    for (const pattern of trailingSections) {
      cleaned = cleaned.replace(new RegExp(pattern, 'gis'), '');
    }
    
    return cleaned.trim();
  }

  private extractKeywords(content: string, section: HIGSection): string[] {
    const keywords = new Set<string>();
    
    // Add section title and platform
    keywords.add(section.title.toLowerCase());
    keywords.add(section.platform.toLowerCase());
    keywords.add(section.category.toLowerCase());
    
    // Extract from content
    const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    
    for (const word of words) {
      if (this.appleDesignTerms.includes(word)) {
        keywords.add(word);
      }
    }
    
    return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
  }

  private extractRelatedSections(content: string, _section: HIGSection): string[] {
    const related = new Set<string>();
    
    // Simple pattern matching for "See also" sections
    const seeAlsoMatch = content.match(/see also[:\s]+(.*?)(?:\n|$)/i);
    if (seeAlsoMatch) {
      const links = seeAlsoMatch[1].match(/\[([^\]]+)\]/g) || [];
      links.forEach(link => {
        const title = link.slice(1, -1);
        related.add(title);
      });
    }
    
    return Array.from(related).slice(0, 5);
  }

  private calculateQualityMetrics(content: string, originalContent?: string): ContentQualityMetrics {
    const length = content.length;
    const headingCount = (content.match(/^#+/gm) || []).length;
    const codeExamplesCount = (content.match(/```/g) || []).length / 2;
    const imageReferencesCount = (content.match(/!\[.*?\]/g) || []).length;
    
    // Enhanced fallback detection (check original content for better detection)
    const isFallbackContent = this.detectFallbackContent(content, originalContent);
    
    // Check for Apple SPA issues (malformed content that isn't complete fallback)
    const hasAppleSPAIssues = this.appleSPAIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
    
    // Calculate structure score
    const structureScore = Math.min(1.0, (headingCount * 0.1) + (codeExamplesCount * 0.2));
    
    // Calculate Apple terms score
    const appleTermsFound = this.appleDesignTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    const appleTermsScore = Math.min(1.0, appleTermsFound / 10);
    
    // Calculate content quality indicators
    const hasSubstantialContent = length > 400; // Lowered threshold
    const hasGuidelines = content.toLowerCase().includes('best practices') || 
                         content.toLowerCase().includes('guideline') ||
                         content.toLowerCase().includes('consider') ||
                         content.toLowerCase().includes('avoid') ||
                         content.toLowerCase().includes('should') ||
                         content.toLowerCase().includes('when');
    
    // Calculate guideline quality score
    const guidelineScore = hasGuidelines ? 0.4 : 0; // Increased weight for guidelines
    
    // Bonus for well-structured content
    const structureBonus = headingCount >= 2 ? 0.2 : 0;
    
    // Overall quality score with enhanced detection
    let score: number;
    if (isFallbackContent) {
      score = 0.1; // Clear fallback content
    } else if (hasAppleSPAIssues && !hasSubstantialContent) {
      score = 0.3; // SPA content with issues but some real content
    } else {
      // Normal quality calculation for good content
      const lengthScore = Math.min(1.0, length / 800); // Lowered threshold: 800 chars = perfect length score
      score = lengthScore * 0.2 + structureScore * 0.15 + appleTermsScore * 0.15 + guidelineScore * 0.35 + structureBonus * 0.15;
    }
    
    return {
      score: Math.min(1.0, score),
      length,
      structureScore,
      appleTermsScore,
      codeExamplesCount,
      imageReferencesCount,
      headingCount,
      isFallbackContent,
      extractionMethod: 'turndown-enhanced',
      confidence: isFallbackContent ? 0.1 : Math.min(1.0, score + 0.1)
    };
  }

  private detectFallbackContent(content: string, originalContent?: string): boolean {
    const contentLower = content.toLowerCase();
    const originalLower = originalContent?.toLowerCase() || contentLower;
    
    // Check if content has substantial guidelines/practices (indicating real content)
    const hasSubstantialRealContent = content.length > 500 && 
      (contentLower.includes('best practices') || 
       contentLower.includes('guideline') ||
       contentLower.includes('accessibility') ||
       contentLower.includes('consider') ||
       contentLower.includes('ensure') ||
       contentLower.includes('avoid'));
    
    // If we have substantial real content, it's not fallback even if it has JS warnings
    if (hasSubstantialRealContent) {
      return false;
    }
    
    // Primary fallback indicators (check both cleaned and original content)
    const hasFallbackIndicators = this.fallbackIndicators.some(indicator => 
      contentLower.includes(indicator) || originalLower.includes(indicator)
    );
    
    // Secondary indicators: very short content with SPA artifacts
    const isTooShort = content.length < 200;
    const hasOnlySPAIndicators = this.appleSPAIndicators.some(indicator => 
      contentLower.includes(indicator) || originalLower.includes(indicator)
    );
    
    // If content mentions JavaScript issues but has little real content
    const hasJavaScriptIssues = (contentLower.includes('javascript') || originalLower.includes('javascript')) && 
      (contentLower.includes('required') || contentLower.includes('turn on') ||
       originalLower.includes('required') || originalLower.includes('turn on'));
    
    return hasFallbackIndicators || (hasJavaScriptIssues && !hasSubstantialRealContent) || (isTooShort && hasOnlySPAIndicators);
  }

  private generateFrontMatter(section: HIGSection, quality: ContentQualityMetrics, keywords: string[]): string {
    const frontMatter = {
      title: section.title,
      platform: section.platform,
      category: section.category,
      url: section.url,
      quality_score: Math.round(quality.score * 100) / 100,
      content_length: quality.length,
      last_updated: new Date().toISOString(),
      keywords: keywords,
      has_code_examples: quality.codeExamplesCount > 0,
      has_images: quality.imageReferencesCount > 0,
      is_fallback: quality.isFallbackContent
    };

    return '---\n' + Object.entries(frontMatter)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}`)
      .join('\n') + '\n---\n\n';
  }
}