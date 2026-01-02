import { Server } from "socket.io";
import Redis from "ioredis";

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Socket.io server
const io = new Server(PORT, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// Redis subscriber for Pub/Sub
const subscriber = new Redis(REDIS_URL);

subscriber.on("error", (err) => {
  console.error("Redis Subscriber Error:", err);
});

subscriber.on("connect", () => {
  console.log("✅ Connected to Redis Pub/Sub");
});

// Subscribe to meeting updates channel
await subscriber.subscribe("meeting_updates", (err) => {
  if (err) {
    console.error("Failed to subscribe:", err);
  } else {
    console.log("📡 Subscribed to meeting_updates channel");
  }
});

// Handle messages from Redis Pub/Sub
subscriber.on("message", (channel, message) => {
  if (channel === "meeting_updates") {
    try {
      const data = JSON.parse(message);
      const { meetingId, ...payload } = data;

      // Emit to specific meeting room
      io.to(`meeting_${meetingId}`).emit("update", payload);

      console.log(`📤 Broadcasted to meeting_${meetingId}:`, payload.type);
    } catch (err) {
      console.error("Failed to parse message:", err);
    }
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join meeting room
  socket.on("join_meeting", (meetingId) => {
    socket.join(`meeting_${meetingId}`);
    console.log(`👤 ${socket.id} joined meeting_${meetingId}`);
  });

  // Leave meeting room
  socket.on("leave_meeting", (meetingId) => {
    socket.leave(`meeting_${meetingId}`);
    console.log(`👋 ${socket.id} left meeting_${meetingId}`);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

console.log(`🚀 Socket.io server running on port ${PORT}`);
