// User database schema.

const mongoose = require('mongoose');

// Schema for user accounts.
const userSchema = new mongoose.Schema({
  /** Full display name of the user */
  name: {
    type: String,
    required: true,
    trim: true
  },
  /** Unique email address used for authentication and collaboration notifications */
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  /** Bcrypt-hashed password securely stored for JWT verification */
  password: {
    type: String,
    required: true
  },
  /** URL linking to a DiceBear SVG avatar generated dynamically for user presence */
  avatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

