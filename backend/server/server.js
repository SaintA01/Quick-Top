import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(express.json());

// Allow CORS from your frontend and mobile app (adjust origin as needed)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps/native)
    callback(null, true);
  },
  credentials: true,
}));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.json({ message: 'QuickTop API running' }));

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
