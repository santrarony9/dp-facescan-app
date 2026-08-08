const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  bannerUrl: { type: String }, // Used as Album Cover Picture
  watermarkUrl: { type: String }, // Used as Logo Watermark on downloads
  eventDate: { type: Date },
  clientName: { type: String },
  clientPhone: { type: String },
  clientPasskey: { type: String }, // Auto-generated 6-digit code
  guestPrivacyEnabled: { type: Boolean, default: true }, // true: Guest sees only their photos. false: Guest sees all event photos
  albumStatus: { 
    type: String, 
    enum: ['Selecting', 'Designing', 'Proofing', 'Approved', 'Completed'],
    default: 'Selecting'
  },
  largeFaceListId: { type: String }, // Azure LargeFaceList ID
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate 6-digit passkey on creation
EventSchema.pre('save', async function() {
  if (!this.clientPasskey) {
    this.clientPasskey = Math.floor(100000 + Math.random() * 900000).toString();
  }
});

module.exports = mongoose.model('Event', EventSchema);
