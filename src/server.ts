import "module-alias/register";

/**
 * Module dependencies.
 */

import app from "./app";
import http from "http";
import { CONFIG } from "@common/config.common";

// import { setupSocket } from "@controllers/taskManagement.controller";
import { socketConnection } from "@helpers/socket";

// console.clear();
console.log("Starting server... \n");

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(CONFIG.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

export const server = http.createServer(app);

socketConnection(server); 

// export const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:8080",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   },
// });
// io.on("connection", (socket: any) => {
//   console.log("New connection:", socket.id);
//   socket.broadcast.emit("check", "how are you");

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });
// setupSocket();

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string | any) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  console.log("Listening on " + bind);
}
