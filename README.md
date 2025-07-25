# Feedback Chat Server ⚡🔌

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/socket.io-4.7.2-blue)](https://socket.io/)

The backend server for the Feedback Chat Application, handling real-time communication using Socket.io with optional persistence layer.

## Key Features

- ⚡ **Real-time bidirectional communication** with Socket.io
- 🔌 **Event-driven architecture** for chat messages
- 📦 **Message persistence** (in-memory or database)
- 🔒 **Authentication middleware** for WebSocket connections
- 🛡️ **Rate limiting** to prevent abuse
- 📊 **Room/Channel management** for organized chats
- 📝 **Message history** for new connections

## Tech Stack

**Core:**
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Socket.io](https://socket.io/) (v4.x)
- [Express](https://expressjs.com/) (for HTTP server)

**Optional Add-ons:**
- [Redis](https://redis.io/) (for scaling with Socket.io adapter)
- [MongoDB](https://www.mongodb.com/) (for message persistence)
- [JWT](https://jwt.io/) (for authentication)

## Prerequisites

- Node.js v16+
- npm/yarn/pnpm
- (Optional) Redis server if using Redis adapter
- (Optional) MongoDB if persisting messages

## Installation

```bash
git clone https://github.com/arman8808/feedback-Chat-bot-backend.git
cd feedback-chat-server
npm install