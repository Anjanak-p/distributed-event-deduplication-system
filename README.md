# Distributed Event Deduplication System

## Overview

This project implements a distributed event processing system that ensures no duplicate events are processed across multiple listeners. It uses a combination of **Node.js**, **Redis**, and **MongoDB** to achieve distributed coordination, message delivery, and persistence. The goal is to demonstrate a production-grade architecture for handling real-time event streams with exactly-once processing semantics.

The system includes:
- A **Broadcaster Service** that publishes events.
- Multiple **Listener Services** that consume and process events.
- A **Redis Layer** that provides distributed deduplication and locking.
- A **MongoDB Database** for event persistence and tracking.

This project is designed for scalability, reliability, and resilience against message duplication in a distributed environment.




## Tech Stack

- **Node.js / Express.js** – Backend runtime and web framework.
- **Socket.io** – Real-time communication between broadcaster and listeners.
- **Redis** – Distributed in-memory datastore for deduplication and locking.
- **MongoDB** – Database for persistent storage of processed events.
- **Docker** (optional) – Containerization for consistent local development.


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
