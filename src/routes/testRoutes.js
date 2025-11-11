const express = require('express');
const router = express.Router();

/**
 * @desc    Health check endpoint
 * @route   GET /api/test/health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

/**
 * @desc    Database connection check
 * @route   GET /api/test/db
 * @access  Public
 */
router.get('/db', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    success: true,
    database: {
      status: states[dbState],
      name: mongoose.connection.name,
      host: mongoose.connection.host
    }
  });
});

module.exports = router;
