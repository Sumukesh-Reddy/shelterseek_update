//97
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  maxdays: {
    type: Number,
    required: true
  },
  propertyType: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  roomType: {
    type: String,
    required: true
  },
  bedrooms: {
    type: Number,
    required: true
  },
  beds: {
    type: Number,
    required: true
  },
  roomSize: {
    type: String,
    required: true
  },
  roomLocation: String,
  transportDistance: String,
  hostGender: String,
  foodFacility: String,
  amenities: [String],
  discount: Number,
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  likes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  booking: {
    type: Boolean,
    default: false 
  },
  reviews: [{
    type: String,
    
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'RoomData',
    versionKey: false,
    autoIndex: true ,
    id: false 
 });

module.exports = mongoose.model('Listing', listingSchema);