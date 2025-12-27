// API Route - Database Initialization
// ============================================
// This route initializes the database with schema and seed data
// Only for development use!

import { Hono } from 'hono';
import type { Env } from '../types';

const admin = new Hono<{ Bindings: Env }>();

// Initialize database schema
admin.post('/init-schema', async (c) => {
  const db = c.env.DB;
  
  try {
    // Use batch() to execute multiple statements
    const statements = [
      // Create users table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar TEXT,
          role TEXT,
          industries TEXT,
          preferences TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      
      // Create pulses table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS pulses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          color TEXT,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `),
      
      // Create sources table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          config TEXT NOT NULL,
          filter_rules TEXT,
          sync_interval INTEGER DEFAULT 3600,
          last_sync_at DATETIME,
          last_sync_status TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `),
      
      // Create pulse_sources table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS pulse_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pulse_id INTEGER NOT NULL,
          source_id INTEGER NOT NULL,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pulse_id) REFERENCES pulses(id) ON DELETE CASCADE,
          FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
          UNIQUE(pulse_id, source_id)
        )
      `),
      
      // Create contents table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS contents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          summary TEXT,
          url TEXT,
          author TEXT,
          content_type TEXT NOT NULL,
          raw_content TEXT,
          processed_content TEXT,
          media_url TEXT,
          thumbnail_url TEXT,
          duration INTEGER,
          tags TEXT,
          language TEXT,
          published_at DATETIME,
          fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_read BOOLEAN DEFAULT 0,
          is_starred BOOLEAN DEFAULT 0,
          is_archived BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
        )
      `),
      
      // Create analysts table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS analysts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          creator_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          avatar TEXT,
          category TEXT,
          system_prompt TEXT NOT NULL,
          model TEXT DEFAULT 'gpt-4',
          temperature REAL DEFAULT 0.7,
          max_tokens INTEGER DEFAULT 2000,
          is_public BOOLEAN DEFAULT 0,
          is_template BOOLEAN DEFAULT 0,
          usage_count INTEGER DEFAULT 0,
          rating REAL DEFAULT 0,
          rating_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `),
      
      // Create pulse_analysts table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS pulse_analysts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pulse_id INTEGER NOT NULL,
          analyst_id INTEGER NOT NULL,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pulse_id) REFERENCES pulses(id) ON DELETE CASCADE,
          FOREIGN KEY (analyst_id) REFERENCES analysts(id) ON DELETE CASCADE,
          UNIQUE(pulse_id, analyst_id)
        )
      `),
      
      // Create analyses table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content_id INTEGER NOT NULL,
          analyst_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          result TEXT NOT NULL,
          tokens_used INTEGER,
          is_helpful BOOLEAN,
          feedback TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
          FOREIGN KEY (analyst_id) REFERENCES analysts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `),
      
      // Create analyst_subscriptions table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS analyst_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          analyst_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (analyst_id) REFERENCES analysts(id) ON DELETE CASCADE,
          UNIQUE(user_id, analyst_id)
        )
      `)
    ];
    
    await db.batch(statements);
    
    return c.json({ 
      success: true,
      message: 'Database schema created successfully'
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Failed to create schema',
      message: error.message
    }, 500);
  }
});

// Seed initial data
admin.post('/seed', async (c) => {
  const db = c.env.DB;
  
  try {
    const statements = [
      // Insert demo user
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, name, role, industries, preferences) VALUES 
        (1, 'demo@readmaster.com', 'Demo User', 'product_manager', 
         '["tech", "finance"]', 
         '{"theme": "dark", "language": "zh-CN"}')
      `),
      
      // Insert demo pulses
      db.prepare(`
        INSERT OR IGNORE INTO pulses (id, user_id, name, description, icon, color, sort_order) VALUES 
        (1, 1, '投资决策脉络', '跟踪市场动态、财经新闻和投资机会', '📈', '#3B82F6', 1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO pulses (id, user_id, name, description, icon, color, sort_order) VALUES 
        (2, 1, '产品趋势脉络', '关注产品创新、用户体验和行业趋势', '💼', '#8B5CF6', 2)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO pulses (id, user_id, name, description, icon, color, sort_order) VALUES 
        (3, 1, '竞品监控脉络', '实时跟踪竞争对手动态和市场变化', '🎯', '#10B981', 3)
      `),
      
      // Insert built-in analysts
      db.prepare(`
        INSERT OR IGNORE INTO analysts (id, creator_id, name, description, category, system_prompt, is_template) VALUES 
        (1, 1, '要点提炼师', '快速提取文章核心观点，生成5条关键要点', 'content_processor',
         'You are an expert content analyst. Extract 5 key points from the given content in Chinese. Format as numbered list with clear, concise statements.',
         1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO analysts (id, creator_id, name, description, category, system_prompt, is_template) VALUES 
        (2, 1, 'SWOT分析师', '从商业战略角度进行SWOT四象限分析', 'framework',
         'You are a business strategy consultant. Analyze the content using SWOT framework (Strengths, Weaknesses, Opportunities, Threats). Provide detailed analysis in Chinese.',
         1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO analysts (id, creator_id, name, description, category, system_prompt, is_template) VALUES 
        (3, 1, '竞品分析师', '从产品经理视角拆解竞品功能和策略', 'domain_expert',
         'You are a senior product manager. Analyze competitor products mentioned in the content. Focus on: 1) Feature list 2) Innovation points 3) User scenarios 4) Learnings 5) Potential issues. Respond in Chinese.',
         1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO analysts (id, creator_id, name, description, category, system_prompt, is_template) VALUES 
        (4, 1, '价值投资顾问', '从价值投资角度评估投资机会', 'domain_expert',
         'You are a value investment advisor following Warren Buffett principles. Analyze investment opportunities mentioned in the content. Consider: 1) Business moat 2) Management quality 3) Financial health 4) Valuation 5) Risks. Respond in Chinese.',
         1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO analysts (id, creator_id, name, description, category, system_prompt, is_template) VALUES 
        (5, 1, '用户需求洞察师', '挖掘内容背后的用户需求和痛点', 'domain_expert',
         'You are a user research expert. Identify user needs, pain points, and behavioral insights from the content. Provide actionable insights for product development. Respond in Chinese.',
         1)
      `),
      
      // Assign analysts to pulses
      db.prepare(`INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES (1, 1, 1)`),
      db.prepare(`INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES (1, 4, 2)`),
      db.prepare(`INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES (2, 1, 1)`),
      db.prepare(`INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES (2, 3, 2)`),
      db.prepare(`INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES (2, 5, 3)`),
      db.prepare(`INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES (3, 2, 1)`),
      db.prepare(`INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES (3, 3, 2)`)
    ];
    
    await db.batch(statements);
    
    return c.json({ 
      success: true,
      message: 'Database seeded successfully'
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Failed to seed database',
      message: error.message
    }, 500);
  }
});

// Clear all contents
admin.delete('/contents', async (c) => {
  const db = c.env.DB;
  
  try {
    await db.prepare('DELETE FROM contents').run();
    await db.prepare('DELETE FROM analyses').run();
    
    return c.json({ 
      success: true,
      message: 'All contents cleared'
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Failed to clear contents',
      message: error.message
    }, 500);
  }
});

// Test endpoint to check environment variables
admin.get('/env-check', async (c) => {
  return c.json({
    has_api_key: !!c.env.OPENAI_API_KEY,
    has_base_url: !!c.env.OPENAI_BASE_URL,
    api_key_preview: c.env.OPENAI_API_KEY ? c.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT SET',
    base_url: c.env.OPENAI_BASE_URL || 'NOT SET'
  });
});

export default admin;
