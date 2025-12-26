// API Routes - Analysts Management
// ============================================

import { Hono } from 'hono';
import { Database } from '../lib/database';
import type { Env, CreateAnalystRequest, AnalyzeContentRequest } from '../types';

const analysts = new Hono<{ Bindings: Env }>();

// Get all analysts (templates + user's own)
analysts.get('/', async (c) => {
  const db = new Database(c.env.DB);
  const userId = 1; // TODO: Get from auth middleware
  
  const analystsData = await db.getAnalysts(userId);
  
  return c.json({ analysts: analystsData });
});

// Get a specific analyst
analysts.get('/:id', async (c) => {
  const db = new Database(c.env.DB);
  const analystId = parseInt(c.req.param('id'));
  
  const analyst = await db.getAnalyst(analystId);
  if (!analyst) {
    return c.json({ error: 'Analyst not found' }, 404);
  }
  
  return c.json({ analyst });
});

// Create a new analyst
analysts.post('/', async (c) => {
  const db = new Database(c.env.DB);
  const userId = 1; // TODO: Get from auth middleware
  const data = await c.req.json<CreateAnalystRequest>();
  
  const analyst = await db.createAnalyst(userId, data);
  
  return c.json({ analyst }, 201);
});

// Analyze content with an analyst
analysts.post('/analyze', async (c) => {
  const db = new Database(c.env.DB);
  const userId = 1; // TODO: Get from auth middleware
  const { content_id, analyst_id } = await c.req.json<AnalyzeContentRequest>();
  
  // Get content
  const contents = await db.getContents(undefined, 1000);
  const content = contents.find(c => c.id === content_id);
  if (!content) {
    return c.json({ error: 'Content not found' }, 404);
  }
  
  // Get analyst
  const analyst = await db.getAnalyst(analyst_id);
  if (!analyst) {
    return c.json({ error: 'Analyst not found' }, 404);
  }
  
  try {
    // Call OpenAI API (or other LLM)
    const result = await analyzeWithAI(
      content,
      analyst,
      c.env.OPENAI_API_KEY || ''
    );
    
    // Save analysis
    const analysis = await db.createAnalysis({
      content_id,
      analyst_id,
      user_id: userId,
      result: result.text,
      tokens_used: result.tokens
    });
    
    return c.json({ analysis });
  } catch (error: any) {
    return c.json({ 
      error: 'Failed to analyze content', 
      message: error.message 
    }, 500);
  }
});

// Get analyses for a content
analysts.get('/content/:contentId', async (c) => {
  const db = new Database(c.env.DB);
  const contentId = parseInt(c.req.param('contentId'));
  
  const analyses = await db.getContentAnalyses(contentId);
  
  return c.json({ analyses });
});

export default analysts;

// Helper function to call AI API
async function analyzeWithAI(
  content: any,
  analyst: any,
  apiKey: string
): Promise<{ text: string; tokens: number }> {
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const messages = [
    {
      role: 'system',
      content: analyst.system_prompt
    },
    {
      role: 'user',
      content: `标题：${content.title}\n\n内容：${content.processed_content || content.raw_content}`
    }
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: analyst.model,
      messages,
      temperature: analyst.temperature,
      max_tokens: analyst.max_tokens
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json<any>();
  
  return {
    text: data.choices[0].message.content,
    tokens: data.usage?.total_tokens || 0
  };
}
