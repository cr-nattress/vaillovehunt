import express from 'express';
import { Request, Response } from 'express';

interface StateGetResponse {
  key: string;
  value: any;
  exists: boolean;
}

interface StateSetResponse {
  key: string;
  action: 'created' | 'updated';
  success: boolean;
}

interface StateDeleteResponse {
  key: string;
  success: boolean;
}

interface StateListResponse {
  keys: string[];
  total: number;
}

// In-memory storage for development (similar to localStorage but server-side)
const kvStore = new Map<string, any>();
const kvIndexes = new Map<string, Set<string>>(); // For index support

// GET /kv-get?key=... - retrieve a value by key
export const kvGetHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.query.key as string;
    
    if (!key) {
      res.status(400).json({ error: 'Key query parameter is required' });
      return;
    }
    
    console.log(`🔍 KV GET: ${key}`);
    
    const exists = kvStore.has(key);
    const value = exists ? kvStore.get(key) : null;
    
    if (!exists) {
      // Return error for non-existent keys to match expected BlobService behavior
      res.status(404).json({
        error: `Key ${key} not found`
      });
      return;
    }
    
    // Return format expected by BlobService: { data, etag }
    res.json({
      data: value,
      etag: `etag-${key}-${Date.now()}` // Generate a simple etag
    });
    
  } catch (error) {
    console.error('KV get error:', error);
    res.status(500).json({ 
      error: 'Failed to get value',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /kv-upsert - upsert a key-value pair with optional indexes
export const kvUpsertHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, expectedEtag } = req.body;
    
    if (!key) {
      res.status(400).json({ error: 'Key is required' });
      return;
    }
    
    console.log(`💾 KV UPSERT: ${key}`, { hasValue: value !== undefined, expectedEtag });
    
    const existed = kvStore.has(key);
    
    // For simplicity, ignore etag checking in development 
    // In production, this would check etag for optimistic concurrency
    
    // Store the value
    kvStore.set(key, value);
    
    const newEtag = `etag-${key}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Return format expected by BlobService
    res.json({
      ok: true,
      etag: newEtag,
      key,
      timestamp
    });
    
  } catch (error) {
    console.error('KV upsert error:', error);
    res.status(500).json({ 
      error: 'Failed to upsert value',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /kv-list - list all keys (optionally with values)
export const kvListHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeValues = req.query.includeValues === 'true';
    
    console.log(`📋 KV LIST: includeValues=${includeValues}`);
    
    const keys = Array.from(kvStore.keys());
    
    if (includeValues) {
      // Return key-value pairs
      const items = keys.map(key => ({
        key,
        value: kvStore.get(key)
      }));
      
      res.json({ items });
    } else {
      // Return just keys
      const response: StateListResponse = {
        keys,
        total: keys.length
      };
      
      res.json(response);
    }
    
  } catch (error) {
    console.error('KV list error:', error);
    res.status(500).json({ 
      error: 'Failed to list keys',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// DELETE /kv-delete?key=... - delete a key
export const kvDeleteHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.query.key as string;
    
    if (!key) {
      res.status(400).json({ error: 'Key parameter is required' });
      return;
    }
    
    console.log(`🗑️ KV DELETE: ${key}`);
    
    const existed = kvStore.has(key);
    
    if (existed) {
      kvStore.delete(key);
    }
    
    // Also clean up any indexes that might reference this key
    for (const [indexKey, members] of kvIndexes.entries()) {
      if (members.has(key)) {
        members.delete(key);
      }
    }
    
    const response: StateDeleteResponse = {
      key,
      success: true
    };
    
    // Always return 200 - deleting non-existent key is not an error
    res.json(response);
    
  } catch (error) {
    console.error('KV delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete key',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Express router setup
const router = express.Router();
router.get('/kv-get', kvGetHandler);
router.post('/kv-upsert', kvUpsertHandler);
router.get('/kv-list', kvListHandler);
router.delete('/kv-delete', kvDeleteHandler);

export default router;