// Database helper functions
// ============================================

import type { D1Database } from '@cloudflare/workers-types';
import type { User, Pulse, Source, Content, Analyst, Analysis } from '../types';

export class Database {
  constructor(private db: D1Database) {}
  
  // ============================================
  // User operations
  // ============================================
  
  async getUser(id: number): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
    return result || null;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
    return result || null;
  }
  
  async createUser(data: Partial<User>): Promise<User> {
    const result = await this.db
      .prepare(`
        INSERT INTO users (email, name, avatar, role, industries, preferences)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        data.email!,
        data.name!,
        data.avatar || null,
        data.role || null,
        JSON.stringify(data.industries || []),
        JSON.stringify(data.preferences || {})
      )
      .first<User>();
    return result!;
  }
  
  // ============================================
  // Pulse operations
  // ============================================
  
  async getPulses(userId: number): Promise<Pulse[]> {
    const result = await this.db
      .prepare('SELECT * FROM pulses WHERE user_id = ? ORDER BY sort_order ASC')
      .bind(userId)
      .all<Pulse>();
    return result.results || [];
  }
  
  async getPulse(id: number): Promise<Pulse | null> {
    const result = await this.db
      .prepare('SELECT * FROM pulses WHERE id = ?')
      .bind(id)
      .first<Pulse>();
    return result || null;
  }
  
  async createPulse(userId: number, data: Partial<Pulse>): Promise<Pulse> {
    const result = await this.db
      .prepare(`
        INSERT INTO pulses (user_id, name, description, icon, color, sort_order)
        VALUES (?, ?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) FROM pulses WHERE user_id = ?), 0) + 1)
        RETURNING *
      `)
      .bind(
        userId,
        data.name!,
        data.description || null,
        data.icon || null,
        data.color || null,
        userId
      )
      .first<Pulse>();
    return result!;
  }
  
  async updatePulse(id: number, data: Partial<Pulse>): Promise<void> {
    await this.db
      .prepare(`
        UPDATE pulses 
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            icon = COALESCE(?, icon),
            color = COALESCE(?, color),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        data.name || null,
        data.description || null,
        data.icon || null,
        data.color || null,
        id
      )
      .run();
  }
  
  async deletePulse(id: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM pulses WHERE id = ?')
      .bind(id)
      .run();
  }
  
  // ============================================
  // Source operations
  // ============================================
  
  async getSources(userId: number): Promise<Source[]> {
    const result = await this.db
      .prepare('SELECT * FROM sources WHERE user_id = ?')
      .bind(userId)
      .all();
    
    return (result.results || []).map(this.parseSourceRow);
  }
  
  async getSource(id: number): Promise<Source | null> {
    const result = await this.db
      .prepare('SELECT * FROM sources WHERE id = ?')
      .bind(id)
      .first();
    
    return result ? this.parseSourceRow(result) : null;
  }
  
  async getPulseSources(pulseId: number): Promise<Source[]> {
    const result = await this.db
      .prepare(`
        SELECT s.* FROM sources s
        JOIN pulse_sources ps ON s.id = ps.source_id
        WHERE ps.pulse_id = ?
        ORDER BY ps.sort_order ASC
      `)
      .bind(pulseId)
      .all();
    
    return (result.results || []).map(this.parseSourceRow);
  }
  
  async createSource(userId: number, data: Partial<Source>): Promise<Source> {
    const result = await this.db
      .prepare(`
        INSERT INTO sources (user_id, name, type, config, filter_rules, sync_interval)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        userId,
        data.name!,
        data.type!,
        JSON.stringify(data.config || {}),
        JSON.stringify(data.filter_rules || {}),
        data.sync_interval || 3600
      )
      .first();
    
    return this.parseSourceRow(result!);
  }
  
  async addSourceToPulse(pulseId: number, sourceId: number): Promise<void> {
    await this.db
      .prepare(`
        INSERT OR IGNORE INTO pulse_sources (pulse_id, source_id, sort_order)
        VALUES (?, ?, COALESCE((SELECT MAX(sort_order) FROM pulse_sources WHERE pulse_id = ?), 0) + 1)
      `)
      .bind(pulseId, sourceId, pulseId)
      .run();
  }
  
  async removeSourceFromPulse(pulseId: number, sourceId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM pulse_sources WHERE pulse_id = ? AND source_id = ?')
      .bind(pulseId, sourceId)
      .run();
  }
  
  // ============================================
  // Content operations
  // ============================================
  
  async getContents(sourceId?: number, limit: number = 50): Promise<Content[]> {
    let query = 'SELECT * FROM contents';
    const params: any[] = [];
    
    if (sourceId) {
      query += ' WHERE source_id = ?';
      params.push(sourceId);
    }
    
    query += ' ORDER BY published_at DESC LIMIT ?';
    params.push(limit);
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all();
    
    return (result.results || []).map(this.parseContentRow);
  }
  
  async getPulseContents(pulseId: number, limit: number = 50): Promise<Content[]> {
    const result = await this.db
      .prepare(`
        SELECT DISTINCT c.* FROM contents c
        JOIN sources s ON c.source_id = s.id
        JOIN pulse_sources ps ON s.id = ps.source_id
        WHERE ps.pulse_id = ?
        ORDER BY c.published_at DESC
        LIMIT ?
      `)
      .bind(pulseId, limit)
      .all();
    
    return (result.results || []).map(this.parseContentRow);
  }
  
  async createContent(data: Partial<Content>): Promise<Content> {
    const result = await this.db
      .prepare(`
        INSERT INTO contents (
          source_id, title, summary, url, author, content_type,
          raw_content, processed_content, media_url, thumbnail_url,
          duration, tags, language, published_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        data.source_id!,
        data.title!,
        data.summary || null,
        data.url || null,
        data.author || null,
        data.content_type || 'text',
        data.raw_content || null,
        data.processed_content || null,
        data.media_url || null,
        data.thumbnail_url || null,
        data.duration || null,
        JSON.stringify(data.tags || []),
        data.language || null,
        data.published_at || null
      )
      .first();
    
    return this.parseContentRow(result!);
  }
  
  // ============================================
  // Analyst operations
  // ============================================
  
  async getAnalysts(userId?: number): Promise<Analyst[]> {
    let query = 'SELECT * FROM analysts WHERE is_template = 1';
    const params: any[] = [];
    
    if (userId) {
      query += ' OR creator_id = ?';
      params.push(userId);
    }
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<Analyst>();
    
    return result.results || [];
  }
  
  async getAnalyst(id: number): Promise<Analyst | null> {
    const result = await this.db
      .prepare('SELECT * FROM analysts WHERE id = ?')
      .bind(id)
      .first<Analyst>();
    return result || null;
  }
  
  async getPulseAnalysts(pulseId: number): Promise<Analyst[]> {
    const result = await this.db
      .prepare(`
        SELECT a.* FROM analysts a
        JOIN pulse_analysts pa ON a.id = pa.analyst_id
        WHERE pa.pulse_id = ? AND pa.is_active = 1
        ORDER BY pa.sort_order ASC
      `)
      .bind(pulseId)
      .all<Analyst>();
    
    return result.results || [];
  }
  
  async createAnalyst(userId: number, data: Partial<Analyst>): Promise<Analyst> {
    const result = await this.db
      .prepare(`
        INSERT INTO analysts (
          creator_id, name, description, category, system_prompt,
          model, temperature, max_tokens, is_public
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        userId,
        data.name!,
        data.description || null,
        data.category!,
        data.system_prompt!,
        data.model || 'gpt-4',
        data.temperature || 0.7,
        data.max_tokens || 2000,
        data.is_public ? 1 : 0
      )
      .first<Analyst>();
    
    return result!;
  }
  
  async addAnalystToPulse(pulseId: number, analystId: number): Promise<void> {
    await this.db
      .prepare(`
        INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order)
        VALUES (?, ?, COALESCE((SELECT MAX(sort_order) FROM pulse_analysts WHERE pulse_id = ?), 0) + 1)
      `)
      .bind(pulseId, analystId, pulseId)
      .run();
  }
  
  // ============================================
  // Analysis operations
  // ============================================
  
  async createAnalysis(data: Partial<Analysis>): Promise<Analysis> {
    const result = await this.db
      .prepare(`
        INSERT INTO analyses (content_id, analyst_id, user_id, result, tokens_used)
        VALUES (?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        data.content_id!,
        data.analyst_id!,
        data.user_id!,
        data.result!,
        data.tokens_used || null
      )
      .first<Analysis>();
    
    return result!;
  }
  
  async getContentAnalyses(contentId: number): Promise<Analysis[]> {
    const result = await this.db
      .prepare('SELECT * FROM analyses WHERE content_id = ?')
      .bind(contentId)
      .all<Analysis>();
    
    return result.results || [];
  }
  
  // ============================================
  // Helper functions
  // ============================================
  
  private parseSourceRow(row: any): Source {
    return {
      ...row,
      config: JSON.parse(row.config || '{}'),
      filter_rules: JSON.parse(row.filter_rules || '{}')
    };
  }
  
  private parseContentRow(row: any): Content {
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      is_read: !!row.is_read,
      is_starred: !!row.is_starred,
      is_archived: !!row.is_archived
    };
  }
}
