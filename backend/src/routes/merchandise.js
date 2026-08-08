const express = require('express');
const router = express.Router();
const Merchandise = require('../models/Merchandise');
const { auth, adminAuth } = require('../middleware/auth');

// Public: Get all active merchandise
router.get('/public', async (req, res) => {
  try {
    const merch = await Merchandise.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching merchandise' });
  }
});

// Admin: Get all merchandise
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const merch = await Merchandise.find().sort({ createdAt: -1 });
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching merchandise' });
  }
});

// Admin: Create merchandise
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const merch = new Merchandise(req.body);
    await merch.save();
    res.status(201).json(merch);
  } catch (err) {
    res.status(500).json({ message: 'Error creating merchandise' });
  }
});

// Admin: Update merchandise
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const merch = await Merchandise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: 'Error updating merchandise' });
  }
});

// Admin: Delete merchandise
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await Merchandise.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting merchandise' });
  }
});

module.exports = router;
