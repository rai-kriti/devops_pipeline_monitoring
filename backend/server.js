require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const githubRoutes = require('./routes/github');
const aiRoutes = require('./routes/ai');
const dockerRoutes = require('./routes/docker');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/github', githubRoutes);
app.use('/ai', aiRoutes);
app.use('/docker', dockerRoutes);
app.use('/health', healthRoutes);

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
