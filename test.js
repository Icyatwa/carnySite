// server.js - Updated with proper CORS configuration
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const posts = require('./routes/posts');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration - Updated to handle your specific case
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://cnshop.yepper.cc/', // Add your actual frontend domain here
    // Add any other domains you need
  ],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 200 // For legacy browser support
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Alternative: For development, you can use a more permissive CORS setup
// Uncomment the line below and comment out the above corsOptions if you want to allow all origins during development
// app.use(cors({ origin: true, credentials: true }));

app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', posts);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for:', corsOptions.origin);
});