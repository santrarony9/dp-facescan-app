const mongoose = require('mongoose');

const merchandiseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  basePrice: { type: Number, required: true },
  sizes: [{ 
    name: { type: String },
    price: { type: Number } 
  }],
  colors: [{ type: String }],
  images: [{ type: String }], // Array of S3 URLs
  iconType: { type: String, enum: ['frame', 'mug', 'keyring', 'shirt', 'photo'], default: 'frame' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Merchandise', merchandiseSchema);
