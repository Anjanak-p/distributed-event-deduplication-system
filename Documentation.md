# Distributed Event Deduplication System

## Overview

This project implements a distributed event processing system that ensures no duplicate events are processed across multiple listeners. It uses a combination of **Node.js**, **Redis**, and **MongoDB** to achieve distributed coordination, message delivery, and persistence. The goal is to demonstrate a production-grade architecture for handling real-time event streams with exactly-once processing semantics.

The system includes:
- A **Broadcaster Service** that publishes events.
- Multiple **Listener Services** that consume and process events.
- A **Redis Layer** that provides distributed deduplication and locking.
- A **MongoDB Database** for event persistence and tracking.

This project is designed for scalability, reliability, and resilience against message duplication in a distributed environment.

## Architecture

```text
             ┌──────────────────────────┐
             │        Broadcaster       │
             │  Emits events via WS     │
             └────────────┬─────────────┘
                          │
                    WebSocket Broadcast
                          │
              ┌───────────┴────────────┐
              │                        │
      ┌───────▼───────┐        ┌───────▼───────┐
      │   Listener 1   │        │   Listener 2   │
      │ Receives event │        │ Receives event │
      └───────┬────────┘        └───────┬────────┘
              │                         │
              └──────────┬──────────────┘
                         │
                     ┌───▼───┐
                     │ Redis │   → Distributed lock & deduplication
                     └───┬───┘
                         │
                     ┌───▼──────────┐
                     │ MongoDB      │   → Stores processed events
                     └──────────────┘

```
### Where Deduplication Happens
Deduplication occurs in **Redis**, during the **claim-and-process** stage.  
When a listener receives an event:
1. It tries to claim it in Redis using `SETNX (set if not exists)`.
2. Only one listener succeeds.
3. The winning listener processes and persists the event to MongoDB.
4. A short TTL ensures that stale locks automatically expire if processing fails.

This guarantees atomicity and prevents race conditions between concurrent listeners.

## Pseudocode
```bash
onEvent(event):
    if redis.SETNX(event.id, listener.id) == false:
        return  // already claimed elsewhere

    redis.EXPIRE(event.id, LOCK_TTL)

    try:
        process(event)
        storeInMongo(event)
    catch:
        logError(event)
    finally:
        // lock expires automatically, ensuring cleanup
```
## Tech Stack

- **Node.js / Express.js** – Backend runtime and web framework.
- **Socket.io** – Real-time communication between broadcaster and listeners.
- **Redis** – Distributed in-memory datastore for deduplication and locking.
- **MongoDB** – Database for persistent storage of processed events.


## Prerequisites

Before running the project, make sure you have:

- Node.js (>= 18.x)
- MongoDB (local or cloud instance)
- Redis server (local or remote)
- npm or yarn package manager

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Anjanak-p/distributed-event-deduplication-system.git
cd distributed-event-deduplication-system
```
### 2. Install Dependencies

Install dependencies for both services.

Broadcaster
```bash
cd event-broadcaster
npm install
```
Listener
```bash
cd ../event-listener
npm install
```
### 3.Running the Project
#### Step 1: Start the Broadcaster

In a new terminal:
```bash
cd distributed-event-deduplication/event-broadcaster
npm start
```

This launches the broadcaster, which emits events to connected listeners.

#### Step 2: Run Multiple Listeners Locally

Open multiple terminal windows to simulate multiple listeners.



Terminal A:
```bash
cd distributed-event-deduplication/event-listener
INSTANCE_ID=listener-1 PORT=3001 npm start
```

Terminal B:
```bash
cd distributed-event-deduplication/event-listener
INSTANCE_ID=listener-2 PORT=3002 npm start
```

Terminal C:
```bash
cd distributed-event-deduplication/event-listener
INSTANCE_ID=listener-3 PORT=3003 npm start
```
