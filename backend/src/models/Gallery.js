const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  photoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', GallerySchema);
