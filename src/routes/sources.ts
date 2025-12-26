// API Routes - Sources Management
// ============================================

import { Hono } from 'hono';
import { Database } from '../lib/database';
import { adapterFactory } from '../adapters/factory';
import type { Env, CreateSourceRequest } from '../types';

const sources = new Hono<{ Bindings: Env }>();

// Get all sources for current user
sources.get('/', async (c) => {
  const db = new Database(c.env.DB);
  const userId = 1; // TODO: Get from auth middleware
  
  const sourcesData = await db.getSources(userId);
  
  return c.json({ sources: sourcesData });
});

// Get supported source types
sources.get('/types', async (c) => {
  const types = adapterFactory.getSupportedTypes();
  
  return c.json({ 
    types: types.map(type => ({
      type,
      name: type.toUpperCase(),
      description: `${type} source adapter`
    }))
  });
});

// Get a specific source
sources.get('/:id', async (c) => {
  const db = new Database(c.env.DB);
  const sourceId = parseInt(c.req.param('id'));
  
  const source = await db.getSource(sourceId);
  if (!source) {
    return c.json({ error: 'Source not found' }, 404);
  }
  
  return c.json({ source });
});

// Create a new source
sources.post('/', async (c) => {
  const db = new Database(c.env.DB);
  const userId = 1; // TODO: Get from auth middleware
  const data = await c.req.json<CreateSourceRequest>();
  
  // Validate source type
  const adapter = adapterFactory.get(data.type);
  if (!adapter) {
    return c.json({ error: 'Unsupported source type' }, 400);
  }
  
  if (!adapter.validate(data.config)) {
    return c.json({ error: 'Invalid source configuration' }, 400);
  }
  
  const source = await db.createSource(userId, data);
  
  return c.json({ source }, 201);
});

// Sync a source (fetch new content)
sources.post('/:id/sync', async (c) => {
  const db = new Database(c.env.DB);
  const sourceId = parseInt(c.req.param('id'));
  
  const source = await db.getSource(sourceId);
  if (!source) {
    return c.json({ error: 'Source not found' }, 404);
  }
  
  const adapter = adapterFactory.get(source.type);
  if (!adapter) {
    return c.json({ error: 'Adapter not found' }, 500);
  }
  
  try {
    // Fetch content from source
    const rawContents = await adapter.fetch(source.config);
    
    // Transform and save content
    let savedCount = 0;
    for (const raw of rawContents) {
      const content = adapter.transform(raw, sourceId, 'text');
      
      // Apply filter rules if configured
      if (source.filter_rules && !passesFilter(content, source.filter_rules)) {
        continue;
      }
      
      await db.createContent(content);
      savedCount++;
    }
    
    return c.json({ 
      success: true, 
      fetched: rawContents.length,
      saved: savedCount
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Failed to sync source', 
      message: error.message 
    }, 500);
  }
});

// Get contents from a source
sources.get('/:id/contents', async (c) => {
  const db = new Database(c.env.DB);
  const sourceId = parseInt(c.req.param('id'));
  const limit = parseInt(c.req.query('limit') || '50');
  
  const contents = await db.getContents(sourceId, limit);
  
  return c.json({ contents });
});

export default sources;

// Helper function to apply filter rules
function passesFilter(content: any, rules: any): boolean {
  // Keyword filtering
  if (rules.keywords && rules.keywords.length > 0) {
    const text = (content.title + ' ' + content.processed_content).toLowerCase();
    const hasKeyword = rules.keywords.some((keyword: string) => 
      text.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) return false;
  }
  
  // Exclusion filtering
  if (rules.exclude && rules.exclude.length > 0) {
    const text = (content.title + ' ' + content.processed_content).toLowerCase();
    const hasExcluded = rules.exclude.some((keyword: string) => 
      text.includes(keyword.toLowerCase())
    );
    if (hasExcluded) return false;
  }
  
  // Length filtering
  if (rules.min_length && content.processed_content.length < rules.min_length) {
    return false;
  }
  if (rules.max_length && content.processed_content.length > rules.max_length) {
    return false;
  }
  
  return true;
}
