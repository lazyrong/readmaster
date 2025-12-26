// Base Source Adapter
// ============================================

import type { SourceAdapter, SourceConfig, RawContent, Content, ContentType } from '../types';

export abstract class BaseSourceAdapter implements SourceAdapter {
  abstract type: string;
  
  abstract fetch(config: SourceConfig): Promise<RawContent[]>;
  
  abstract validate(config: SourceConfig): boolean;
  
  transform(raw: RawContent, sourceId: number, contentType: ContentType = 'text'): Content {
    return {
      id: 0, // Will be set by database
      source_id: sourceId,
      title: raw.title,
      summary: this.generateSummary(raw.content),
      url: raw.url,
      author: raw.author,
      content_type: contentType,
      raw_content: raw.content,
      processed_content: raw.content,
      media_url: raw.media_url,
      thumbnail_url: raw.thumbnail_url,
      duration: raw.duration,
      published_at: raw.published_at || new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      is_read: false,
      is_starred: false,
      is_archived: false,
      created_at: new Date().toISOString()
    };
  }
  
  protected generateSummary(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
  
  protected async fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
