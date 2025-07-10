// Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false // Changed from true to false
  },
  description: {
    type: String,
    required: false // Changed from true to false
  },
  price: {
    type: String,
    required: false // Changed from true to false
  },
  image: {
    type: String,
    default: ''
  },
  contact: {
    type: String,
    required: true // Keep contact as required
  },
  category: {
    type: String,
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);