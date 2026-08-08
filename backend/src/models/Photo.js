const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  faceIds: [{ type: String }], // Azure Face IDs
  isProcessed: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false }, // Client selection for physical album
  originalFilename: { type: String }, // Store the original file name for local matching
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', PhotoSchema);
