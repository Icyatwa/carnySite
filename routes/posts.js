// routes/posts.js (Routes remain the same)
const express = require('express');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all posts (public)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Get all posts (admin - includes inactive)
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Create new post (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, image, contact, category } = req.body;
    
    const newPost = new Post({
      title,
      description,
      price,
      image,
      contact,
      category
    });
    
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Update post (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, image, contact, category } = req.body;
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, description, price, image, contact, category },
      { new: true }
    );
    
    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error updating post' });
  }
});

// Delete post (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// Toggle post active status (admin only)
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    post.isActive = !post.isActive;
    await post.save();
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling post status' });
  }
});

module.exports = router;