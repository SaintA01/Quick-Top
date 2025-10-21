import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Route imports
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import servicesRoutes from './routes/services.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const corsOptions = FRONTEND_URL === '*' ? { origin: true, credentials: true } : { origin: FRONTEND_URL, credentials: true };
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/services', servicesRoutes);

// Basic health route
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

// Connect to MongoDB and start
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || null;

async function start() {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set. The app will still start but DB operations will fail. Set MONGODB_URI in Vercel env.');
  } else {
    try {
      await mongoose.connect(MONGODB_URI, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
      });
      console.log('✅ MongoDB connected');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();

export default app;
