import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initDB } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';

import trascationsRoute from './routes/transactionsRoute.js';
import authRoute from './routes/authRoute.js';
import usersRoute from './routes/usersRoute.js';
import aiRoute from './routes/aiRoute.js';
import marketRoute from './routes/marketRoute.js';
import goalsRoute from './routes/goalsRoute.js';
import analyticsRoute from './routes/analyticsRoute.js';
import remindersRoute from './routes/remindersRoute.js';
import investmentRoute from './routes/investmentRoute.js';
import paymentsRoute from './routes/paymentsRoute.js';
import { startAllJobs } from './config/cron.js';

dotenv.config();

const app = express();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

app.set('trust proxy', true);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimiter);

if (process.env.NODE_ENV === 'production') {
  startAllJobs();
}

const PORT = process.env.PORT || 5001;

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/transactions', trascationsRoute);
app.use('/api/ai', aiRoute);
app.use('/api/market', marketRoute);
app.use('/api/goals', goalsRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/reminders', remindersRoute);
app.use('/api/investments', investmentRoute);
app.use('/api/payments', paymentsRoute);

initDB().then(() => {
  const HOST = process.env.HOST || '0.0.0.0'; // Escuchar en todas las interfaces para permitir conexiones desde dispositivos en la red local
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is up and running on http://${HOST}:${PORT}`);
    console.log(`📱 Accesible desde dispositivos en la red local: http://172.20.10.5:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use. Try closing other Node processes.`);
      console.log('Hint: run "taskkill /F /IM node.exe" and start again.');
    } else {
      console.log('Server error:', err.message);
    }
  });

  process.on('SIGTERM', () => {
    console.log('Shutting server down...');
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(0);
    });
  });
});

//Vamos campeon, tu puedes con esta app, pronto haras las propias sin necesidad de ver video tutoriales
//Confio en mi, tu eres yo, y yo soy tu, animo little kimosabi
