const mongoose = require('mongoose');

const AlbumProofSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  pdfUrl: { type: String, required: true },
  version: { type: Number, default: 1 },
  feedback: [{
    comment: String,
    column: String, // Optional: for specific location or page
    createdAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['Pending', 'Correction Required', 'Approved'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AlbumProof', AlbumProofSchema);
