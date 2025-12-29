import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { configurePassport } from './config/passport';
import { errorHandler } from './middlewares/error.middleware';
import { logger } from './utils/logger';


import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import shareRoutes from './routes/share.routes';


dotenv.config();


const app: Application = express();


app.set('trust proxy', 1);


app.use(helmet());


// CORS configuration - handle both HTTP and HTTPS for the same domain
const getCorsOrigin = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origins = [frontendUrl];
  
  // If FRONTEND_URL is HTTP, also allow HTTPS version (common issue)
  if (frontendUrl.startsWith('http://')) {
    origins.push(frontendUrl.replace('http://', 'https://'));
  }
  // If FRONTEND_URL is HTTPS, also allow HTTP version (for local development)
  if (frontendUrl.startsWith('https://') && process.env.NODE_ENV !== 'production') {
    origins.push(frontendUrl.replace('https://', 'http://'));
  }
  
  return origins;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = getCorsOrigin();
      
      // Check if origin matches any allowed origin
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In production, be strict; in development, allow for debugging
        if (process.env.NODE_ENV === 'production') {
          logger.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
          callback(new Error('Not allowed by CORS'));
        } else {
          callback(null, true); // Allow in development for debugging
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}


app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());


configurePassport();


app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});


app.use('/api/auth', authRoutes);
app.use('/api', shareRoutes);
app.use('/api/files', fileRoutes);


app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});


app.use(errorHandler);


connectDatabase()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;

