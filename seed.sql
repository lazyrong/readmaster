-- Seed data for ReadMaster
-- ============================================

-- Insert demo user
INSERT OR IGNORE INTO users (id, email, name, role, industries, preferences) VALUES 
  (1, 'demo@readmaster.com', 'Demo User', 'product_manager', 
   '["tech", "finance"]', 
   '{"theme": "dark", "language": "zh-CN"}');

-- Insert demo pulses (脉络)
INSERT OR IGNORE INTO pulses (id, user_id, name, description, icon, color, sort_order) VALUES 
  (1, 1, '投资决策脉络', '跟踪市场动态、财经新闻和投资机会', '📈', '#3B82F6', 1),
  (2, 1, '产品趋势脉络', '关注产品创新、用户体验和行业趋势', '💼', '#8B5CF6', 2),
  (3, 1, '竞品监控脉络', '实时跟踪竞争对手动态和市场变化', '🎯', '#10B981', 3);

-- Insert demo sources (信息源)
INSERT OR IGNORE INTO sources (id, user_id, name, type, config, filter_rules, sync_interval) VALUES 
  (1, 1, '36氪科技新闻', 'rss', 
   '{"url": "https://36kr.com/feed"}',
   '{"keywords": ["AI", "创业", "融资"], "exclude": []}',
   3600),
  (2, 1, 'TechCrunch', 'rss',
   '{"url": "https://techcrunch.com/feed/"}',
   '{"keywords": ["startup", "AI", "funding"], "exclude": []}',
   3600),
  (3, 1, 'Product Hunt', 'rss',
   '{"url": "https://www.producthunt.com/feed"}',
   '{"keywords": ["product", "design", "tool"], "exclude": []}',
   7200);

-- Link sources to pulses
INSERT OR IGNORE INTO pulse_sources (pulse_id, source_id, sort_order) VALUES 
  (1, 1, 1),  -- 投资决策 <- 36氪
  (2, 2, 1),  -- 产品趋势 <- TechCrunch
  (2, 3, 2),  -- 产品趋势 <- Product Hunt
  (3, 1, 1);  -- 竞品监控 <- 36氪

-- Insert built-in analysts (内置分析师)
INSERT OR IGNORE INTO analysts (id, creator_id, name, description, category, system_prompt, is_template) VALUES 
  (1, 1, '要点提炼师', '快速提取文章核心观点，生成5条关键要点', 'content_processor',
   'You are an expert content analyst. Extract 5 key points from the given content in Chinese. Format as numbered list with clear, concise statements.',
   1),
  
  (2, 1, 'SWOT分析师', '从商业战略角度进行SWOT四象限分析', 'framework',
   'You are a business strategy consultant. Analyze the content using SWOT framework (Strengths, Weaknesses, Opportunities, Threats). Provide detailed analysis in Chinese.',
   1),
  
  (3, 1, '竞品分析师', '从产品经理视角拆解竞品功能和策略', 'domain_expert',
   'You are a senior product manager. Analyze competitor products mentioned in the content. Focus on: 1) Feature list 2) Innovation points 3) User scenarios 4) Learnings 5) Potential issues. Respond in Chinese.',
   1),
  
  (4, 1, '价值投资顾问', '从价值投资角度评估投资机会', 'domain_expert',
   'You are a value investment advisor following Warren Buffett principles. Analyze investment opportunities mentioned in the content. Consider: 1) Business moat 2) Management quality 3) Financial health 4) Valuation 5) Risks. Respond in Chinese.',
   1),
  
  (5, 1, '用户需求洞察师', '挖掘内容背后的用户需求和痛点', 'domain_expert',
   'You are a user research expert. Identify user needs, pain points, and behavioral insights from the content. Provide actionable insights for product development. Respond in Chinese.',
   1);

-- Assign analysts to pulses
INSERT OR IGNORE INTO pulse_analysts (pulse_id, analyst_id, sort_order) VALUES 
  (1, 1, 1),  -- 投资决策 <- 要点提炼师
  (1, 4, 2),  -- 投资决策 <- 价值投资顾问
  (2, 1, 1),  -- 产品趋势 <- 要点提炼师
  (2, 3, 2),  -- 产品趋势 <- 竞品分析师
  (2, 5, 3),  -- 产品趋势 <- 用户需求洞察师
  (3, 2, 1),  -- 竞品监控 <- SWOT分析师
  (3, 3, 2);  -- 竞品监控 <- 竞品分析师

-- Insert sample content (for demo purposes)
INSERT OR IGNORE INTO contents (id, source_id, title, summary, url, content_type, author, published_at) VALUES 
  (1, 1, 'OpenAI 发布新一代 AI 模型', 
   'OpenAI 宣布推出更强大的 GPT-5 模型，在推理能力和多模态理解方面取得突破。',
   'https://example.com/openai-gpt5',
   'text',
   '36氪编辑部',
   datetime('now', '-2 hours')),
  
  (2, 2, 'Y Combinator Winter 2024 Batch Highlights',
   'Analysis of the most promising startups from YC W24 batch, focusing on AI and enterprise tools.',
   'https://example.com/yc-w24',
   'text',
   'TechCrunch Staff',
   datetime('now', '-5 hours')),
  
  (3, 3, 'Notion AI Templates - Product of the Day',
   'A new Notion plugin that generates customizable templates using AI for various workflows.',
   'https://example.com/notion-ai-templates',
   'text',
   'Product Hunt',
   datetime('now', '-1 day'));
