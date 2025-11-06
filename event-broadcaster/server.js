require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let connectedListeners = 0;
let eventCounter = 0;

io.on('connection', (socket) => {
  connectedListeners++;
  console.log(`✓ Listener connected. Total listeners: ${connectedListeners}`);

  socket.on('disconnect', () => {
    connectedListeners--;
    console.log(`✗ Listener disconnected. Total listeners: ${connectedListeners}`);
  });
});

function getRandomEventType() {
  const types = ['order','payment','notification','user_action','system_event'];
  return types[Math.floor(Math.random()*types.length)];
}
function generateRandomPayload() {
  return {
    userId: `user-${Math.floor(Math.random()*1000)}`,
    amount: Math.floor(Math.random()*10000),
    status: ['pending','processing','completed'][Math.floor(Math.random()*3)],
    metadata: { source: 'api', version: '1.0' }
  };
}

function broadcastEvent() {
  const event = {
    id: `event-${uuidv4()}`,
    type: getRandomEventType(),
    timestamp: new Date().toISOString(),
    payload: generateRandomPayload(),
    sequenceNumber: ++eventCounter
  };
  io.emit('new-event', event);
  console.log(`📡 Broadcasted: ${event.id} Type:${event.type} to ${connectedListeners} listeners`);
}

app.get('/health', (req,res) => {
  res.json({ status: 'healthy', connectedListeners, totalEventsBroadcasted: eventCounter });
});

app.post('/broadcast-burst', express.json(), (req,res) => {
  const count = parseInt(req.body.count) || 10;
  console.log(`🚀 Broadcasting burst of ${count} events`);
  for (let i=0;i<count;i++){
    setTimeout(broadcastEvent, i*100);
  }
  res.json({ message:`Broadcasting ${count} events`, listeners: connectedListeners });
});

// Broadcast every 3s by default
setInterval(broadcastEvent, 3000);

server.listen(PORT, () => {
  console.log(`🎯 Event Broadcaster running on port ${PORT}`);
});
