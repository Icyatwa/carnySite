// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Check if setup is complete (if admin exists)
exports.checkSetup = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      // No admin exists - needs initial setup
      return res.json({
        setupComplete: false,
        needsCredentialSetup: false,
        defaultCredentials: {
          username: 'admin@gmail.com',
          password: 'admin123'
        }
      });
    }
    
    // Admin exists - check if still using default credentials
    const isUsingDefaultCredentials = admin.email === 'admin@gmail.com';
    
    res.json({
      setupComplete: true,
      needsCredentialSetup: isUsingDefaultCredentials,
      defaultCredentials: isUsingDefaultCredentials ? {
        username: 'admin@gmail.com',
        password: 'admin123'
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Initial setup route - creates default admin
exports.setup = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Setup already completed' 
      });
    }

    const admin = await User.create({
      email: 'admin@gmail.com',
      password: 'admin123',
      name: 'Site Administrator',
      role: 'admin'
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Initial setup completed - please change default credentials',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isSetup: false // Indicates needs credential change
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Complete setup - change default credentials
exports.completeSetup = async (req, res) => {
  try {
    const { newUsername, newPassword } = req.body;
    
    if (!newUsername || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide new username and password' 
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find the admin user first
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Update the admin user properties
    admin.email = newUsername;
    admin.password = newPassword;
    if (req.body.newName) {
      admin.name = req.body.newName;
    }

    // Save the admin user (this will trigger the pre('save') middleware)
    await admin.save();

    // Generate new token
    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'Setup completed successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isSetup: true
      }
    });
  } catch (error) {
    console.error('Complete setup error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already in use' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Verify token and get user info
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if using default credentials
    const isDefaultCredentials = user.email === 'admin@gmail.com';

    res.json({
      success: true,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSetup: !isDefaultCredentials
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body; // Changed from email to username
    console.log('Login attempt for username:', username);
    
    // Check if username and password exist
    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user with password (search by email field)
    const user = await User.findOne({ email: username }).select('+password');
    console.log('User found in database:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found for username:', username);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    console.log('User exists, checking password...');
    const passwordMatch = await user.comparePassword(password);
    console.log('Password match result:', passwordMatch);

    if (!passwordMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    console.log('User role:', user.role);
    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('User is not admin');
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Check if using default credentials
    const isDefaultCredentials = user.email === 'admin@gmail.com';

    // Create token
    const token = generateToken(user._id);
    console.log('Token generated successfully');

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isSetup: !isDefaultCredentials
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Keep the old register and createAdmin methods for backward compatibility
exports.register = async (req, res) => {
  try {
    // Check registration token
    const { registrationToken } = req.body;
    
    if (!registrationToken || registrationToken !== process.env.ADMIN_REGISTRATION_TOKEN) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid registration token' 
      });
    }
    
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Registration closed. Admin already exists.' 
      });
    }

    // Validate input
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide name, email and password' 
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    // Create token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already in use' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    // This is a setup endpoint - you should comment it out after creating the initial admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await User.create({
      email: 'admin@gmail.com',
      password: 'admin123',
      name: 'Site Administrator',
      role: 'admin'
    });

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
