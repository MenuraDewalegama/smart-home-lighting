// require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const MONGO_URI = 'mongodb+srv://sit729:sit729@sit729.dxqnuii.mongodb.net/?retryWrites=true&w=majority&appName=SIT729';


// MongoDB Model
const RoomLightSchema = new mongoose.Schema({
  room: String,
  status: String,
  timestamp: { type: Date, default: Date.now }
});
const RoomLight = mongoose.model('RoomLight', RoomLightSchema);

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// MQTT Client Setup
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

mqttClient.on('connect', () => {
  console.log('[MQTT] Connected to broker');
  mqttClient.subscribe('smarthome/rooms/+/lights/main/command');
});

// When a message is received, save room and status to MongoDB
mqttClient.on('message', async (topic, payload) => {
  const message = payload.toString(); // Get the message from the MQTT payload
  
  const parts = topic.split('/');
  const room = parts[2]; 
  
  // Save room and status to MongoDB
  const newLightStatus = new RoomLight({ room, status: message });
  
  try {
    await newLightStatus.save();
    console.log('[MQTT] Data saved to MongoDB:', { room, status: message });
  } catch (err) {
    console.error('[Error] Saving data:', err);
  }
});

// API Endpoint to fetch light status for rooms
app.get('/api/rooms', async (req, res) => {
  try {
    // Fetch the latest room light status records
    const rooms = await RoomLight.find().sort({ timestamp: -1 }).limit(10); 
    res.json(rooms);
  } catch (err) {
    console.error('[Error] Fetching rooms:', err);
    res.status(500).json({ error: 'Error fetching rooms data' });
  }
});

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
