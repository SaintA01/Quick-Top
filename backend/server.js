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

// Load environment variables
dotenv.config();

const app = express();

// ✅ Trust proxy (Fixes express-rate-limit "X-Forwarded-For" issue on Vercel)
app.set('trust proxy', 1);

// ✅ Basic security middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// ✅ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,  // Disable old headers
});
app.use(limiter);

// ✅ CORS setup — allow your frontend domain or all if not set
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const corsOptions =
  FRONTEND_URL === '*'
    ? { origin: true, credentials: true }
    : { origin: [FRONTEND_URL, 'https://quicktop.42web.io'], credentials: true };

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/services', servicesRoutes);

// ✅ Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'OK' });
});

// ✅ Fallback route for root
app.get('/', (req, res) => {
  res.send('🚀 QuickTop Backend is running successfully on Vercel!');
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Error caught:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// ✅ MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 20000, // wait up to 20s before timeout
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 QuickTop API root: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

export default app;
