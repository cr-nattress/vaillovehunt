// Load environment variables FIRST
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Get current file path for proper .env resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

// Load .env.local first (has precedence), then .env as fallback
const envLocalPath = path.join(projectRoot, '.env.local');
const envPath = path.join(projectRoot, '.env');

console.log('🔍 Loading environment files:');
console.log('  .env.local:', envLocalPath);
console.log('  .env:', envPath);

dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

console.log('🔑 RESEND_API_KEY loaded:', process.env.RESEND_API_KEY ? 'YES' : 'NO');
console.log('✅ Environment loaded, now importing services...');
// Force server restart to pick up environment changes

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import collageRouter from './collageRoute';
import kvRouter from './kvRoute';
import photoRouter from './photoRoute';
import eventsRouter from './eventsRoute';
import eventsRouterV2 from './eventsRouteV2';
import authRouter from './authRoute';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging to file (logs/access.log)
try {
  const logsDir = path.join(projectRoot, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const accessLogPath = path.join(logsDir, 'access.log');
  const accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));
  console.log(`📝 HTTP access logs writing to: ${accessLogPath}`);
} catch (e) {
  console.warn('⚠️  Failed to initialize access log stream:', e instanceof Error ? e.message : e);
}

// Serve static files from public directory
const publicPath = path.join(__dirname, '../../public');
app.use(express.static(publicPath));

// API routes
app.use('/api', collageRouter);
app.use('/api', kvRouter);
app.use('/api', photoRouter);
app.use('/api', eventsRouter);
app.use('/api/auth', authRouter);

// API V2 routes (new service layer)
app.use('/api/v2', eventsRouterV2);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'not-set'
    }
  });
});

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files served from: ${publicPath}`);
  console.log(`☁️  Cloudinary configured: ${!!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)}`);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️  Warning: Cloudinary not configured. Check your .env file.');
  }
});

export default app;