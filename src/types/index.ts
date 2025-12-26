// Core type definitions for ReadMaster
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  industries?: string[];
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Pulse {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sources?: Source[];
  analysts?: Analyst[];
}

export type SourceType = 
  | 'rss' 
  | 'youtube' 
  | 'figma-mcp' 
  | 'wechat' 
  | 'xiaohongshu'
  | 'github'
  | 'twitter'
  | 'podcast'
  | 'browser-tabs';

export interface SourceConfig {
  url?: string;
  apiKey?: string;
  channelId?: string;
  username?: string;
  [key: string]: any;
}

export interface FilterRule {
  keywords?: string[];
  exclude?: string[];
  regex?: string[];
  ai_extract?: {
    enabled: boolean;
    prompt?: string;
  };
  content_type?: string[];
  min_length?: number;
  max_length?: number;
}

export interface Source {
  id: number;
  user_id: number;
  name: string;
  type: SourceType;
  config: SourceConfig;
  filter_rules?: FilterRule;
  sync_interval: number;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'failed' | 'in_progress';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ContentType = 'text' | 'video' | 'audio' | 'design' | 'code';

export interface Content {
  id: number;
  source_id: number;
  title: string;
  summary?: string;
  url?: string;
  author?: string;
  content_type: ContentType;
  raw_content?: string;
  processed_content?: string;
  media_url?: string;
  thumbnail_url?: string;
  duration?: number;
  tags?: string[];
  language?: string;
  published_at?: string;
  fetched_at: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  created_at: string;
}

export type AnalystCategory = 
  | 'framework'
  | 'domain_expert'
  | 'data_insight'
  | 'content_processor';

export interface Analyst {
  id: number;
  creator_id: number;
  name: string;
  description?: string;
  avatar?: string;
  category: AnalystCategory;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_public: boolean;
  is_template: boolean;
  usage_count: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: number;
  content_id: number;
  analyst_id: number;
  user_id: number;
  result: string;
  tokens_used?: number;
  is_helpful?: boolean;
  feedback?: string;
  created_at: string;
}

// ============================================
// Source Adapter Interface
// ============================================

export interface RawContent {
  title: string;
  content: string;
  url?: string;
  author?: string;
  published_at?: string;
  media_url?: string;
  thumbnail_url?: string;
  duration?: number;
}

export interface SourceAdapter {
  type: SourceType;
  fetch(config: SourceConfig): Promise<RawContent[]>;
  transform(raw: RawContent): Content;
  validate(config: SourceConfig): boolean;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreatePulseRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateSourceRequest {
  name: string;
  type: SourceType;
  config: SourceConfig;
  filter_rules?: FilterRule;
  sync_interval?: number;
}

export interface CreateAnalystRequest {
  name: string;
  description?: string;
  category: AnalystCategory;
  system_prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  is_public?: boolean;
}

export interface AnalyzeContentRequest {
  content_id: number;
  analyst_id: number;
}

export interface BatchAnalyzeRequest {
  content_ids: number[];
  analyst_id: number;
}

// ============================================
// Cloudflare Bindings
// ============================================

export interface Env {
  DB: D1Database;
  CACHE?: KVNamespace;
  OPENAI_API_KEY?: string;
}
