import { Server } from "socket.io";

let io: Server | null = null;
const userSocketMap = new Map<string, string>(); // Store userId -> socketId mapping

export const socketConnection = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:8080", // Change for production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.info(
      `Client connected [id=${socket.id}] with query:`,
      socket.handshake.query
    );

    // Extract userId safely and convert it to string
    const userId = socket.handshake.query.userId as string | undefined;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    } else {
      console.warn(`UserId is missing in handshake query`);
    }

    socket.on("disconnect", () => {
      console.info(`Client disconnected [id=${socket.id}]`);
      userSocketMap.forEach((value, key) => {
        if (value === socket.id) {
          userSocketMap.delete(key);
          console.log(`Removed socket mapping for user ${key}`);
        }
      });
    });
  });
};

// Send message to a specific user
export const sendMessageToUser = (userId: string, message: string) => {
  if (!io) {
    console.error("Socket.io not initialized");
    return;
  }

  const socketId = userSocketMap.get(userId);
  console.log(`Looking for userId: ${userId}, found socketId: ${socketId}`);

  if (socketId) {
    io.to(socketId).emit("check", message);
    console.log(`Message sent to user ${userId}: ${message}`);
  } else {
    console.warn(`User ${userId} is not connected`);
  }
};
