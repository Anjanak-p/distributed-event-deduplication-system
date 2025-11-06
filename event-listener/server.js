require('dotenv').config();
const express = require('express');
const { io: ioClient } = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');

const redisClient = require('./config/redis');
const mongodb = require('./config/mongodb');
const EventProcessor = require('./services/eventProcessor');
const dedupService = require('./services/deduplicationService');
const Logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || `listener-${uuidv4().slice(0,8)}`;
const BROADCASTER_URL = process.env.BROADCASTER_URL || 'http://localhost:4000';

const logger = new Logger(INSTANCE_ID);
const app = express();
app.use(express.json());

let processor;
let socket;

async function initialize() {
  try {
    logger.info('Starting Event Listener');
    await redisClient.connect();
    await dedupService.initialize();
    await mongodb.connect();
    processor = new EventProcessor(INSTANCE_ID);
    connectToBroadcaster();
    logger.success('Event Listener initialized');
  } catch (err) {
    logger.error('Initialization failed', err);
    process.exit(1);
  }
}

function connectToBroadcaster() {
  socket = ioClient(BROADCASTER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity
  });

  socket.on('connect', () => logger.success(`Connected to broadcaster ${BROADCASTER_URL}`));
  socket.on('new-event', async (eventData) => {
    logger.info(`Received event ${eventData.id}`);
    await processor.processEvent(eventData);
  });
  socket.on('disconnect', (reason) => logger.warn('Disconnected from broadcaster', { reason }));
  socket.on('connect_error', (err) => logger.error('Connect error', err));
  socket.on('reconnect', (attempt) => logger.success(`Reconnected after ${attempt} attempts`));
}

// API
app.get('/health', (req,res) => res.json({
  status: 'healthy',
  instanceId: INSTANCE_ID,
  redis: redisClient.isConnected,
  mongodb: mongodb.isConnected,
  websocket: socket?.connected || false
}));

app.get('/stats', async (req,res) => {
  const instanceStats = processor.getStats();
  const redisStats = await dedupService.getStats(INSTANCE_ID);
  res.json({ instance: instanceStats, redis: redisStats });
});

app.get('/events', async (req,res) => {
  try {
    const Event = require('./models/Event');
    const limit = parseInt(req.query.limit) || 50;
    const processedBy = req.query.processedBy;
    const query = processedBy ? { processedBy } : {};
    const events = await Event.find(query).sort({ processedAt: -1 }).limit(limit);
    res.json({ count: events.length, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function shutdown() {
  logger.info('Shutting down...');
  try {
    socket?.disconnect();
    await redisClient.disconnect();
    await mongodb.disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('Shutdown error', err);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, async () => {
  logger.success(`Server running on port ${PORT}`);
  await initialize();
});
