jest.setTimeout(30000);
const mongoose = require('mongoose');
const redisClientSetup = require('../event-listener/config/redis');
const mongodb = require('../event-listener/config/mongodb');
const DedupService = require('../event-listener/services/deduplicationService');
const EventProcessor = require('../event-listener/services/eventProcessor');
const EventModel = require('../event-listener/models/Event');

beforeAll(async () => {
  // connect redis and mongo
  await redisClientSetup.connect();
  await mongodb.connect();
  await DedupService.initialize();
});

afterAll(async () => {
  await redisClientSetup.disconnect();
  await mongodb.disconnect();
});

afterEach(async () => {
  const client = redisClientSetup.getClient();
  const keys = await client.keys('lock:*');
  if (keys.length) await client.del(keys);
  const keys2 = await client.keys('processed:*');
  if (keys2.length) await client.del(keys2);
  await EventModel.deleteMany({});
});

test('multiple processors same event: exactly one processes', async () => {
  const processors = [new EventProcessor('p1'), new EventProcessor('p2'), new EventProcessor('p3')];
  const event = { id: 'ev-1', type: 'order', timestamp: new Date().toISOString(), payload: {}, sequenceNumber: 1 };
  const results = await Promise.all(processors.map(p => p.processEvent(event)));
  const dbCount = await EventModel.countDocuments({ eventId: 'ev-1' });
  const processedCount = results.filter(r => r.success && !r.deduplicated).length;
  const dedupedCount = results.filter(r => r.success && r.deduplicated).length;
  expect(dbCount).toBe(1);
  expect(processedCount).toBe(1);
  expect(dedupedCount).toBe(2);
});

