const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Create Razorpay instance
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// POST /api/payment/create
router.post('/create', async (req, res) => {
  const { customerName, customerMobile, productId, productName, amount, photoUrl } = req.body;
  
  if (!razorpay) {
    return res.status(500).json({ message: 'Razorpay keys not configured' });
  }

  try {
    // 1. Create DB Order first (pending)
    const newOrder = new Order({
      customerName,
      customerMobile,
      productId,
      productName,
      amount,
      photoUrl,
      status: 'pending'
    });
    await newOrder.save();

    // 2. Create Razorpay order
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: newOrder._id.toString()
    };
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    // 3. Update DB Order with razorpayOrderId
    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();

    res.json({
      orderId: newOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
});

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment successful
      order.status = 'paid';
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      await order.save();
      
      res.json({ message: 'Payment verified successfully' });
    } else {
      // Payment verification failed
      order.status = 'failed';
      await order.save();
      res.status(400).json({ message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

module.exports = router;
