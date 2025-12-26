// API Routes - Pulses Management
// ============================================

import { Hono } from 'hono';
import { Database } from '../lib/database';
import type { Env, CreatePulseRequest } from '../types';

const pulses = new Hono<{ Bindings: Env }>();

// Get all pulses for current user
pulses.get('/', async (c) => {
  const db = new Database(c.env.DB);
  const userId = 1; // TODO: Get from auth middleware
  
  const pulsesData = await db.getPulses(userId);
  
  return c.json({ pulses: pulsesData });
});

// Get a specific pulse with sources and contents
pulses.get('/:id', async (c) => {
  const db = new Database(c.env.DB);
  const pulseId = parseInt(c.req.param('id'));
  
  const pulse = await db.getPulse(pulseId);
  if (!pulse) {
    return c.json({ error: 'Pulse not found' }, 404);
  }
  
  const sources = await db.getPulseSources(pulseId);
  const contents = await db.getPulseContents(pulseId, 50);
  const analysts = await db.getPulseAnalysts(pulseId);
  
  return c.json({
    pulse: {
      ...pulse,
      sources,
      analysts
    },
    contents
  });
});

// Create a new pulse
pulses.post('/', async (c) => {
  const db = new Database(c.env.DB);
  const userId = 1; // TODO: Get from auth middleware
  const data = await c.req.json<CreatePulseRequest>();
  
  const pulse = await db.createPulse(userId, data);
  
  return c.json({ pulse }, 201);
});

// Update a pulse
pulses.put('/:id', async (c) => {
  const db = new Database(c.env.DB);
  const pulseId = parseInt(c.req.param('id'));
  const data = await c.req.json();
  
  await db.updatePulse(pulseId, data);
  const pulse = await db.getPulse(pulseId);
  
  return c.json({ pulse });
});

// Delete a pulse
pulses.delete('/:id', async (c) => {
  const db = new Database(c.env.DB);
  const pulseId = parseInt(c.req.param('id'));
  
  await db.deletePulse(pulseId);
  
  return c.json({ success: true });
});

// Add source to pulse
pulses.post('/:id/sources/:sourceId', async (c) => {
  const db = new Database(c.env.DB);
  const pulseId = parseInt(c.req.param('id'));
  const sourceId = parseInt(c.req.param('sourceId'));
  
  await db.addSourceToPulse(pulseId, sourceId);
  
  return c.json({ success: true });
});

// Remove source from pulse
pulses.delete('/:id/sources/:sourceId', async (c) => {
  const db = new Database(c.env.DB);
  const pulseId = parseInt(c.req.param('id'));
  const sourceId = parseInt(c.req.param('sourceId'));
  
  await db.removeSourceFromPulse(pulseId, sourceId);
  
  return c.json({ success: true });
});

// Add analyst to pulse
pulses.post('/:id/analysts/:analystId', async (c) => {
  const db = new Database(c.env.DB);
  const pulseId = parseInt(c.req.param('id'));
  const analystId = parseInt(c.req.param('analystId'));
  
  await db.addAnalystToPulse(pulseId, analystId);
  
  return c.json({ success: true });
});

export default pulses;
