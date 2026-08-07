const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  imageUrl: { type: String, required: true },
  faceIds: [{ type: String }], // Azure Face IDs
  isProcessed: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false }, // Client selection for physical album
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', PhotoSchema);
