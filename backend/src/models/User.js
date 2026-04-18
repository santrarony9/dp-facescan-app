const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  fullName: { type: String },
  email: { type: String },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  personId: { type: String }, // Azure Person ID
  isProcessed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
