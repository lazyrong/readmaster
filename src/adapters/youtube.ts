// YouTube Source Adapter
// ============================================

import { BaseSourceAdapter } from './base';
import type { SourceConfig, RawContent } from '../types';

export class YouTubeAdapter extends BaseSourceAdapter {
  type = 'youtube';
  
  async fetch(config: SourceConfig): Promise<RawContent[]> {
    // Support both channel and playlist
    if (config.channelId) {
      return this.fetchChannelVideos(config);
    } else if (config.playlistId) {
      return this.fetchPlaylistVideos(config);
    }
    throw new Error('Either channelId or playlistId is required');
  }
  
  validate(config: SourceConfig): boolean {
    return !!(config.channelId || config.playlistId);
  }
  
  private async fetchChannelVideos(config: SourceConfig): Promise<RawContent[]> {
    // In production, use YouTube Data API v3
    // For now, we'll use RSS feed which doesn't require API key
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.channelId}`;
    
    try {
      const response = await this.fetchWithTimeout(rssUrl);
      const xml = await response.text();
      return this.parseYouTubeRSS(xml);
    } catch (error) {
      console.error('Failed to fetch YouTube channel:', error);
      return [];
    }
  }
  
  private async fetchPlaylistVideos(config: SourceConfig): Promise<RawContent[]> {
    // Use RSS feed for playlist
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${config.playlistId}`;
    
    try {
      const response = await this.fetchWithTimeout(rssUrl);
      const xml = await response.text();
      return this.parseYouTubeRSS(xml);
    } catch (error) {
      console.error('Failed to fetch YouTube playlist:', error);
      return [];
    }
  }
  
  private parseYouTubeRSS(xml: string): RawContent[] {
    const items: RawContent[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    const matches = xml.matchAll(entryRegex);
    
    for (const match of matches) {
      const entryXml = match[1];
      
      const videoId = this.extractTag(entryXml, 'yt:videoId');
      const title = this.extractTag(entryXml, 'title');
      const author = this.extractTag(entryXml, 'name');
      const published = this.extractTag(entryXml, 'published');
      const description = this.extractTag(entryXml, 'media:description');
      const thumbnail = this.extractAttribute(entryXml, 'media:thumbnail', 'url');
      
      if (videoId && title) {
        items.push({
          title,
          content: description || title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          author,
          published_at: published ? new Date(published).toISOString() : undefined,
          media_url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        });
      }
    }
    
    return items;
  }
  
  private extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }
  
  private extractAttribute(xml: string, tag: string, attr: string): string {
    const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }
}
