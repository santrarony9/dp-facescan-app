const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  highResUrl: { type: String }, // Original untouched high-res image for downloading
  faceIds: [{ type: String }], // Azure Face IDs
  isProcessed: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false }, // Client selection for physical album
  isShowcase: { type: Boolean, default: false }, // Admin selection for public showcase (max 20)
  originalFilename: { type: String }, // Store the original file name for local matching
  category: { type: String, default: 'General' }, // Support for multi-day event buckets
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', PhotoSchema);
