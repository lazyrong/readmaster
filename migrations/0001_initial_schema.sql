-- ReadMaster Database Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  -- User profile for recommendations
  role TEXT,  -- 'product_manager', 'investor', 'entrepreneur', etc.
  industries TEXT,  -- JSON array: ['tech', 'finance', 'healthcare']
  preferences TEXT,  -- JSON object for user preferences
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pulses (脉络) - thematic content collections
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
);

-- Source Adapters (信息源适配器) - extensible source types
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'rss', 'youtube', 'figma-mcp', 'wechat', 'xiaohongshu', etc.
  
  -- Source configuration (JSON)
  config TEXT NOT NULL,  -- { url, apiKey, filters, etc. }
  
  -- Content filtering rules (JSON)
  filter_rules TEXT,  -- { keywords: [], regex: [], ai_extract: {} }
  
  -- Sync settings
  sync_interval INTEGER DEFAULT 3600,  -- seconds
  last_sync_at DATETIME,
  last_sync_status TEXT,  -- 'success', 'failed', 'in_progress'
  
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pulse-Source relationships (many-to-many)
CREATE TABLE IF NOT EXISTS pulse_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pulse_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pulse_id) REFERENCES pulses(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
  UNIQUE(pulse_id, source_id)
);

-- Contents (内容) - fetched and processed content
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  
  -- Content metadata
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  author TEXT,
  
  -- Multimodal content support
  content_type TEXT NOT NULL,  -- 'text', 'video', 'audio', 'design', 'code'
  raw_content TEXT,  -- Original content
  processed_content TEXT,  -- Filtered/extracted content
  
  -- Media data
  media_url TEXT,  -- For video/audio/images
  thumbnail_url TEXT,
  duration INTEGER,  -- For video/audio in seconds
  
  -- Metadata
  tags TEXT,  -- JSON array
  language TEXT,
  published_at DATETIME,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Status
  is_read BOOLEAN DEFAULT 0,
  is_starred BOOLEAN DEFAULT 0,
  is_archived BOOLEAN DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- Analysts (分析师) - AI analyst configurations
CREATE TABLE IF NOT EXISTS analysts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  
  -- Analyst identity
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  category TEXT,  -- 'framework', 'domain_expert', 'data_insight', 'content_processor'
  
  -- AI configuration
  system_prompt TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4',
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  
  -- Sharing settings
  is_public BOOLEAN DEFAULT 0,
  is_template BOOLEAN DEFAULT 0,
  
  -- Statistics
  usage_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pulse-Analyst assignments (which analysts to use for a pulse)
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
);

-- Analyses (分析结果) - AI analysis results
CREATE TABLE IF NOT EXISTS analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  analyst_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Analysis result
  result TEXT NOT NULL,
  tokens_used INTEGER,
  
  -- Feedback
  is_helpful BOOLEAN,
  feedback TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (analyst_id) REFERENCES analysts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User subscriptions to public analysts
CREATE TABLE IF NOT EXISTS analyst_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  analyst_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analyst_id) REFERENCES analysts(id) ON DELETE CASCADE,
  UNIQUE(user_id, analyst_id)
);

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pulses_user_id ON pulses(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(type);
CREATE INDEX IF NOT EXISTS idx_contents_source_id ON contents(source_id);
CREATE INDEX IF NOT EXISTS idx_contents_published_at ON contents(published_at);
CREATE INDEX IF NOT EXISTS idx_contents_is_read ON contents(is_read);
CREATE INDEX IF NOT EXISTS idx_analysts_creator_id ON analysts(creator_id);
CREATE INDEX IF NOT EXISTS idx_analysts_is_public ON analysts(is_public);
CREATE INDEX IF NOT EXISTS idx_analyses_content_id ON analyses(content_id);
CREATE INDEX IF NOT EXISTS idx_analyses_analyst_id ON analyses(analyst_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
