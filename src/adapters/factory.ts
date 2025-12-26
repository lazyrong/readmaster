// Adapter Factory - manages all source adapters
// ============================================

import type { SourceAdapter, SourceType } from '../types';
import { RSSAdapter } from './rss';
import { YouTubeAdapter } from './youtube';

export class AdapterFactory {
  private adapters: Map<SourceType, SourceAdapter>;
  
  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }
  
  private registerDefaultAdapters() {
    this.register(new RSSAdapter());
    this.register(new YouTubeAdapter());
    // Add more adapters here:
    // this.register(new FigmaMCPAdapter());
    // this.register(new WeChatAdapter());
    // this.register(new XiaohongshuAdapter());
  }
  
  register(adapter: SourceAdapter) {
    this.adapters.set(adapter.type as SourceType, adapter);
  }
  
  get(type: SourceType): SourceAdapter | undefined {
    return this.adapters.get(type);
  }
  
  getAll(): SourceAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  getSupportedTypes(): SourceType[] {
    return Array.from(this.adapters.keys());
  }
}

// Singleton instance
export const adapterFactory = new AdapterFactory();
