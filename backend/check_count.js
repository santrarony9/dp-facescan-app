require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const Photo = require('./src/models/Photo');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const events = await Event.find();
  for (const event of events) {
    const count = await Photo.countDocuments({ eventId: event._id });
    console.log(`Event: ${event.name} | Count: ${count}`);
  }
  process.exit(0);
}
run();
