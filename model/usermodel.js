const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Traveler Login Schema
const travelerLoginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  accountType: {
    type: String,
    enum: ['traveller', 'host'],
    default: 'traveller'
  },
  profilePhoto: {
    type: String, // Store GridFS file ID
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'LoginData' });

// Host Login Schema
const hostLoginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  accountType: {
    type: String,
    enum: ['traveller', 'host'],
    default: 'host'
  },
  profilePhoto: {
    type: String, // Store GridFS file ID
    default: null
  },
  propertyDetails: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'LoginData' });

// Common pre-save hook
travelerLoginSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  console.log('Hashing password for:', this.email);
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});
hostLoginSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
travelerLoginSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

hostLoginSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Traveler = mongoose.model('Traveler', travelerLoginSchema);
const Host = mongoose.model('Host', hostLoginSchema);

module.exports = { Traveler, Host };