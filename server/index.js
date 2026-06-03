import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import topicsRoutes from './routes/topics.js';
import auditsRoutes from './routes/audits.js';
import taskbooksRoutes from './routes/taskbooks.js';
import proposalsRoutes from './routes/proposals.js';
import midtermRoutes from './routes/midterm.js';
import finalRoutes from './routes/final.js';
import batchesRoutes from './routes/batches.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/taskbooks', taskbooksRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/midterm', midtermRoutes);
app.use('/api/final', finalRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
