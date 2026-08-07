const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  bannerUrl: { type: String }, // Used as Album Cover Picture
  eventDate: { type: Date },
  clientName: { type: String },
  clientPhone: { type: String },
  clientPasskey: { type: String }, // Auto-generated 6-digit code
  albumStatus: { 
    type: String, 
    enum: ['Selecting', 'Designing', 'Proofing', 'Completed'],
    default: 'Selecting'
  },
  largeFaceListId: { type: String }, // Azure LargeFaceList ID
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate 6-digit passkey on creation
EventSchema.pre('save', function(next) {
  if (!this.clientPasskey) {
    this.clientPasskey = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

module.exports = mongoose.model('Event', EventSchema);
