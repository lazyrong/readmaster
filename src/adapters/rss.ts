// RSS Source Adapter
// ============================================

import { BaseSourceAdapter } from './base';
import type { SourceConfig, RawContent } from '../types';

export class RSSAdapter extends BaseSourceAdapter {
  type = 'rss';
  
  async fetch(config: SourceConfig): Promise<RawContent[]> {
    if (!config.url) {
      throw new Error('RSS URL is required');
    }
    
    try {
      // Use a CORS proxy or RSS parser API
      const response = await this.fetchWithTimeout(config.url);
      const text = await response.text();
      
      return this.parseRSS(text);
    } catch (error) {
      console.error('Failed to fetch RSS:', error);
      return [];
    }
  }
  
  validate(config: SourceConfig): boolean {
    return !!config.url && (
      config.url.startsWith('http://') || 
      config.url.startsWith('https://')
    );
  }
  
  private parseRSS(xml: string): RawContent[] {
    // Simple RSS parser (in production, use a proper XML parser)
    const items: RawContent[] = [];
    
    // Extract items using regex (basic implementation)
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const matches = xml.matchAll(itemRegex);
    
    for (const match of matches) {
      const itemXml = match[1];
      
      const title = this.extractTag(itemXml, 'title');
      const link = this.extractTag(itemXml, 'link');
      const description = this.extractTag(itemXml, 'description');
      const pubDate = this.extractTag(itemXml, 'pubDate');
      const author = this.extractTag(itemXml, 'author') || this.extractTag(itemXml, 'dc:creator');
      
      if (title) {
        items.push({
          title,
          content: this.stripHtml(description || ''),
          url: link,
          author,
          published_at: pubDate ? new Date(pubDate).toISOString() : undefined
        });
      }
    }
    
    return items;
  }
  
  private extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    if (!match) return '';
    
    let content = match[1].trim();
    
    // Remove CDATA tags
    content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    
    return content;
  }
  
  private stripHtml(html: string): string {
    return html
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')  // Remove CDATA first
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
  }
}
