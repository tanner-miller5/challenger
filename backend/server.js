const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database
const { sequelize, testConnection } = require('./config/database');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));

// Routes
app.use('/api', require('./routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Sync database (only in development)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ sync: true });
            console.log('📦 Database synchronized');
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Challenger API Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🗄️  Database: Sequelize + PostgreSQL`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();


module.exports = app;
