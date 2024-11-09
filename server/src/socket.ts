import { Server, Socket } from "socket.io";
import { isValidUrl, kafkaProduceMessage } from "./helper.js";
import AuthController from "./controllers/AuthControllers.js";
import PrismaUtils from "./utils/PrismaUtils.js";
import { prisma } from "./config/db.config.js";

// Types
interface CustomSocket extends Socket {
  room?: string;
  passCode?: string;
  userID?: string;
}

// State Maps
const onlineUsersIdByRoom = new Map<string, Set<string>>();
const typingUsersByRoom = new Map<string, Set<string>>();

// Setup the socket server
export function setupSocket(io: Server) {
  // Middleware for room validation
  io.use(validateRoom);

  // Handle new connections
  io.on("connection", (socket: CustomSocket) => {
    const room = socket.room as string;
    socket.join(room);

    logConnection(socket);
    addUserToRoom(socket, room);

    ////////////////////////////////////////////////////
    // Attach all event listeners here in one place
    ////////////////////////////////////////////////////

    // Message event
    socket.on("message", async (message) => {
      handleMessage(socket, room, message);
    });

    // User Join event
    socket.on("userJoined", (user) => {
      handleUserJoined(io, socket, user);
    });

    // Typing event
    socket.on("typing", (isTyping: boolean) => {
      handleTyping(io, socket, room, isTyping);
    });

    // Disconnect event
    socket.on("disconnect", () => {
      handleDisconnect(io, socket, room);
    });

    // Error handling event
    socket.on("error", (error) => {
      handleError(socket, error);
    });
  });
}

////////////////////////////////////////////////////
// Middleware and Helper Functions
////////////////////////////////////////////////////

// Middleware to validate the room, userID, and passCode
async function validateRoom(socket: CustomSocket, next: Function) {
  try {
    const { room, passCode, userID } = extractAuthDetails(socket);

    if (!room || !passCode || !userID) {
      return next(new Error("Room, passCode, and userID are required"));
    }

    const roomLogin = await AuthController.chatRoomLogin(room, passCode);
    if (!roomLogin) return next(new Error("Invalid room or passCode"));

    const user = await PrismaUtils.findOne(prisma.groupUsers, { id: userID });
    if (!user) return next(new Error("Invalid user"));

    socket.passCode = passCode;
    socket.room = room;
    socket.userID = userID;

    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
}

// Extract auth details from socket handshake
function extractAuthDetails(socket: CustomSocket) {
  const room = socket.handshake.auth.room || socket.handshake.headers.room;
  const passCode =
    socket.handshake.auth.passCode || socket.handshake.headers.passCode;
  const userID =
    socket.handshake.auth.userID || socket.handshake.headers.userID;
  return { room, passCode, userID };
}

// Log connection details
function logConnection(socket: CustomSocket) {
  console.log("#########################");
  console.log("Connected: ", socket.id);
  console.log("#########################");
}

// Add a user to the room's online users map
function addUserToRoom(socket: CustomSocket, room: string) {
  if (!onlineUsersIdByRoom.has(room)) {
    onlineUsersIdByRoom.set(room, new Set());
  }
  onlineUsersIdByRoom.get(room)?.add(socket.userID as string);
}

////////////////////////////////////////////////////
// Event Handler Functions
////////////////////////////////////////////////////

// Handle message event
async function handleMessage(socket: CustomSocket, room: string, message: any) {
  try {
    processMessageFile(message);

    await kafkaProduceMessage(process.env.KAFKA_TOPIC, message).catch(
      (error) => {
        console.error("Error in producing message: ", error);
      }
    );

    socket.in(room).emit("message", message);
  } catch (error) {
    console.error("Error in message handler: ", error);
    socket.emit("error", "An error occurred while sending the message");
  }
}

// Process message file URL validation
function processMessageFile(message: any) {
  if (message.file_url) {
    message.has_file = isValidUrl(message.file_url);
    if (!message.has_file) {
      message.file_url = "";
    }
  }
}

// Handle user join event
function handleUserJoined(io: Server, socket: CustomSocket, user: any) {
  addUserToRoomUsers(socket.room as string, user.id);

  io.in(socket.room).emit("userJoined", {
    onlineUsersID: [...(onlineUsersIdByRoom.get(socket.room) || [])],
    newUser: user,
  });
}

// Add a user to the online users map
function addUserToRoomUsers(room: string, userId: string) {
  if (!onlineUsersIdByRoom.has(room)) {
    onlineUsersIdByRoom.set(room, new Set());
  }
  onlineUsersIdByRoom.get(room)?.add(userId);
}

// Handle typing event
function handleTyping(
  io: Server,
  socket: CustomSocket,
  room: string,
  isTyping: boolean
) {
  manageTypingUsers(room, socket.userID as string, isTyping);

  io.in(room).emit("typing", {
    userID: socket.userID,
    isTyping,
    typingUsers: [...(typingUsersByRoom.get(room) || [])],
  });
}

// Add or remove users from the typing map based on typing status
function manageTypingUsers(room: string, userID: string, isTyping: boolean) {
  if (!typingUsersByRoom.has(room)) {
    typingUsersByRoom.set(room, new Set());
  }

  const roomTypingUsers = typingUsersByRoom.get(room);

  if (isTyping) {
    roomTypingUsers?.add(userID);
  } else {
    roomTypingUsers?.delete(userID);
  }
}

// Handle disconnect event
function handleDisconnect(io: Server, socket: CustomSocket, room: string) {
  removeUserFromRoom(io, socket, room);
  removeUserFromTyping(io, socket, room);
}

// Remove user from online users map upon disconnect
function removeUserFromRoom(io: Server, socket: CustomSocket, room: string) {
  const roomOnlineUsers = onlineUsersIdByRoom.get(room);
  if (roomOnlineUsers) {
    roomOnlineUsers.delete(socket.userID as string);
    if (roomOnlineUsers.size === 0) {
      onlineUsersIdByRoom.delete(room);
    }
  }
  io.in(room).emit("userLeft", {
    onlineUsersID: roomOnlineUsers ? [...roomOnlineUsers] : [],
    userId: socket.userID,
  });
}

// Remove user from typing users map upon disconnect
function removeUserFromTyping(io: Server, socket: CustomSocket, room: string) {
  const roomTypingUsers = typingUsersByRoom.get(room);
  if (roomTypingUsers) {
    roomTypingUsers.delete(socket.userID as string);
    if (roomTypingUsers.size === 0) {
      typingUsersByRoom.delete(room);
    }
  }
  io.in(room).emit("typing", {
    userID: socket.userID,
    isTyping: false,
    typingUsers: [...(roomTypingUsers || [])],
  });
}

// Handle socket error event
function handleError(socket: CustomSocket, error: any) {
  console.error("Socket error: ", error.message);
  socket.emit("error", "An unexpected error occurred");
}

// import { Server, Socket } from "socket.io";
// import { isValidUrl, kafkaProduceMessage, saveImage } from "./helper.js";
// import AuthController from "./controllers/AuthControllers.js";
// import PrismaUtils from "./utils/PrismaUtils.js";
// import { prisma } from "./config/db.config.js";

// // Types
// interface CustomSocket extends Socket {
//   room?: string;
//   passCode?: string;
//   userID?: string;
// }

// // State Maps
// const onlineUsersIdByRoom = new Map<string, Set<string>>();
// const typingUsersByRoom = new Map<string, Set<string>>();

// // Setup the socket server
// export function setupSocket(io: Server) {
//   // Middleware for room validation
//   io.use(validateRoom);

//   // Handle new connections
//   io.on("connection", (socket: CustomSocket) => {
//     const room = socket.room as string;
//     socket.join(room);

//     logConnection(socket);

//     addUserToRoom(socket, room);
//     setupMessageHandlers(io, socket, room);
//     setupUserJoinHandlers(io, socket, room);
//     setupTypingHandlers(io, socket, room);
//     setupDisconnectHandlers(io, socket, room);
//     setupErrorHandling(socket);
//   });
// }

// //     ////////////////////////////////////////////////////
// //     ////////////////////////////////////////////////////
// // Middleware to validate the room, userID, and passCode
// async function validateRoom(socket: CustomSocket, next: Function) {
//   try {
//     const { room, passCode, userID } = extractAuthDetails(socket);

//     if (!room || !passCode || !userID) {
//       return next(new Error("Room, passCode, and userID are required"));
//     }

//     const roomLogin = await AuthController.chatRoomLogin(room, passCode);
//     if (!roomLogin) return next(new Error("Invalid room or passCode"));

//     const user = await PrismaUtils.findOne(prisma.groupUsers, { id: userID });
//     if (!user) return next(new Error("Invalid user"));

//     socket.passCode = passCode;
//     socket.room = room;
//     socket.userID = userID;

//     next();
//   } catch (error) {
//     next(new Error("Authentication error"));
//   }
// }
// // Extract auth details from socket handshake
// function extractAuthDetails(socket: CustomSocket) {
//   const room = socket.handshake.auth.room || socket.handshake.headers.room;
//   const passCode =
//     socket.handshake.auth.passCode || socket.handshake.headers.passCode;
//   const userID =
//     socket.handshake.auth.userID || socket.handshake.headers.userID;
//   return { room, passCode, userID };
// }

// ////////////////////////////////////////////////////
// ////////////////////////////////////////////////////
// // Log connection details
// function logConnection(socket: CustomSocket) {
//   console.log("########################");
//   console.log("Connected: ", socket.id);
//   console.log("#########################");
// }

// ////////////////////////////////////////////////////
// ////////////////////////////////////////////////////
// // Add a user to the room's online users map
// function addUserToRoom(socket: CustomSocket, room: string) {
//   if (!onlineUsersIdByRoom.has(room)) {
//     onlineUsersIdByRoom.set(room, new Set());
//   }
//   onlineUsersIdByRoom.get(room)?.add(socket.userID as string);
// }

// ////////////////////////////////////////////////////
// ////////////////////////////////////////////////////
// // Handle message-related events
// function setupMessageHandlers(io: Server, socket: CustomSocket, room: string) {
//   socket.on("message", async (message) => {
//     try {
//       processMessageFile(message);
//       await kafkaProduceMessage(process.env.KAFKA_TOPIC, message).catch(
//         (error) => {
//           console.error("Error in producing message: ", error);
//         }
//       );
//       socket.in(room).emit("message", message);
//     } catch (error) {
//       console.error("Error in message handler: ", error);
//       socket.emit("error", "An error occurred while sending the message");
//     }
//   });
// }

// // Process message file URL validation
// function processMessageFile(message: any) {
//   if (message.file_url) {
//     message.has_file = isValidUrl(message.file_url);
//     if (!message.has_file) {
//       message.file_url = "";
//     }
//   }
// }

// ////////////////////////////////////////////////////
// ////////////////////////////////////////////////////
// // Handle user join events
// function setupUserJoinHandlers(io: Server, socket: CustomSocket, room: string) {
//   socket.on("userJoined", (user) => {
//     addUserToRoomUsers(socket.room as string, user.id);
//     io.in(socket.room).emit("userJoined", {
//       onlineUsersID: [...(onlineUsersIdByRoom.get(socket.room) || [])],
//       newUser: user,
//     });
//   });
// }

// // Add a user to the online users map
// function addUserToRoomUsers(room: string, userId: string) {
//   if (!onlineUsersIdByRoom.has(room)) {
//     onlineUsersIdByRoom.set(room, new Set());
//   }
//   onlineUsersIdByRoom.get(room)?.add(userId);
// }

// ////////////////////////////////////////////////////
// ////////////////////////////////////////////////////
// // Handle typing-related events
// function setupTypingHandlers(io: Server, socket: CustomSocket, room: string) {
//   socket.on("typing", (isTyping: boolean) => {
//     manageTypingUsers(room, socket.userID as string, isTyping);
//     io.in(room).emit("typing", {
//       userID: socket.userID,
//       isTyping,
//       typingUsers: [...(typingUsersByRoom.get(room) || [])],
//     });
//   });
// }

// // Add or remove users from the typing map based on typing status
// function manageTypingUsers(room: string, userID: string, isTyping: boolean) {
//   if (!typingUsersByRoom.has(room)) {
//     typingUsersByRoom.set(room, new Set());
//   }

//   const roomTypingUsers = typingUsersByRoom.get(room);

//   if (isTyping) {
//     roomTypingUsers?.add(userID);
//   } else {
//     roomTypingUsers?.delete(userID);
//   }
// }

// ////////////////////////////////////////////////////
// ////////////////////////////////////////////////////
// // Handle disconnection-related events
// function setupDisconnectHandlers(
//   io: Server,
//   socket: CustomSocket,
//   room: string
// ) {
//   socket.on("disconnect", () => {
//     removeUserFromRoom(io, socket, room);
//     removeUserFromTyping(io, socket, room);
//   });
// }

// // Remove user from online users map upon disconnect
// function removeUserFromRoom(io: Server, socket: CustomSocket, room: string) {
//   const roomOnlineUsers = onlineUsersIdByRoom.get(room);
//   if (roomOnlineUsers) {
//     roomOnlineUsers.delete(socket.userID as string);
//     if (roomOnlineUsers.size === 0) {
//       onlineUsersIdByRoom.delete(room);
//     }
//   }
//   io.in(room).emit("userLeft", {
//     onlineUsersID: roomOnlineUsers ? [...roomOnlineUsers] : [],
//     userId: socket.userID,
//   });
// }

// // Remove user from typing users map upon disconnect
// function removeUserFromTyping(io: Server, socket: CustomSocket, room: string) {
//   const roomTypingUsers = typingUsersByRoom.get(room);
//   if (roomTypingUsers) {
//     roomTypingUsers.delete(socket.userID as string);
//     if (roomTypingUsers.size === 0) {
//       typingUsersByRoom.delete(room);
//     }
//   }
//   io.in(room).emit("typing", {
//     userID: socket.userID,
//     isTyping: false,
//     typingUsers: [...(roomTypingUsers || [])],
//   });
// }

// ////////////////////////////////////////////////////
// ////////////////////////////////////////////////////
// // Setup global error handling for socket
// function setupErrorHandling(socket: CustomSocket) {
//   socket.on("error", (error) => {
//     console.error("Socket error: ", error.message);
//     socket.emit("error", "An unexpected error occurred");
//   });
// }

// import { Server, Socket } from "socket.io";
// import { isValidUrl, kafkaProduceMessage, saveImage } from "./helper.js";
// import AuthController from "./controllers/AuthControllers.js";
// import PrismaUtils from "./utils/PrismaUtils.js";
// import { prisma } from "./config/db.config.js";

// // Types
// interface CustomSocket extends Socket {
//   room?: string;
//   passCode?: string;
//   userID?: string;
// }

// // Logic
// export function setupSocket(io: Server) {
//   // let onlineUsersID = new Map(); // Store online users
//   let onlineUsersIdByRoom = new Map<string, Set<string>>();
//   let typingUsersByRoom = new Map<string, Set<string>>();
//   ////////////////////////////////////////////////////
//   // Middleware to validate the room
//   ////////////////////////////////////////////////////
//   io.use(async (socket: CustomSocket, next) => {
//     try {
//       const room = socket.handshake.auth.room || socket.handshake.headers.room;
//       const passCode =
//         socket.handshake.auth.passCode || socket.handshake.headers.passCode;

//       const userID =
//         socket.handshake.auth.userID || socket.handshake.headers.userID;

//       if (!room || !passCode || !userID) {
//         return next(new Error("Room, passCode, and userID are required"));
//       }

//       const roomLogin = await AuthController.chatRoomLogin(room, passCode);

//       if (!roomLogin) {
//         return next(new Error("Invalid room or passCode"));
//       }
//       PrismaUtils.findOne(prisma.groupUsers, { id: userID }).then((user) => {
//         if (!user) {
//           return next(new Error("Invalid user"));
//         }
//       });

//       socket.passCode = passCode;
//       socket.room = room;
//       socket.userID = userID;
//       next();
//     } catch (error) {
//       next(new Error("Authentication error"));
//     }
//   });

//   ////////////////////////////////////////////////////
//   // Connection event
//   ////////////////////////////////////////////////////
//   io.on("connection", (socket: CustomSocket) => {
//     // Join the room using the room id from the auth
//     const room = socket.room as string;
//     socket.join(room);

//     console.log("########################");
//     console.log("Connected: ", socket.id);
//     console.log("#########################");

//     // Add the user to the online users map for the room
//     if (!onlineUsersIdByRoom.has(room)) {
//       onlineUsersIdByRoom.set(room, new Set());
//     }
//     onlineUsersIdByRoom.get(room)?.add(socket.userID as string);

//     ////////////////////////////////////////////////////
//     // Message event
//     ////////////////////////////////////////////////////
//     socket.on("message", async (message) => {
//       try {
//         if (message.file_url) {
//           message.has_file = isValidUrl(message.file_url);
//           if (!message.has_file) {
//             message.file_url = "";
//           }
//         }

//         await kafkaProduceMessage(process.env.KAFKA_TOPIC, message).catch(
//           (error) => {
//             console.error("Error in producing message: ", error);
//           }
//         );

//         // Emit the message to the room
//         socket.in(room).emit("message", message);
//       } catch (error) {
//         console.error("Error in message handler: ", error);
//         socket.emit("error", "An error occurred while sending the message");
//       }
//     });

//     ////////////////////////////////////////////////////
//     // User Join event
//     ////////////////////////////////////////////////////
//     socket.on("userJoined", async (user) => {
//       if (!onlineUsersIdByRoom.has(socket.room)) {
//         onlineUsersIdByRoom.set(socket.room, new Set());
//       }

//       const roomOnlineUsers = onlineUsersIdByRoom.get(socket.room);
//       roomOnlineUsers.add(user.id);

//       io.in(socket.room).emit("userJoined", {
//         onlineUsersID: [...roomOnlineUsers],
//         newUser: user,
//       });
//     });

//     ////////////////////////////////////////////////////
//     // Typing event
//     ////////////////////////////////////////////////////
//     socket.on("typing", (isTyping: boolean) => {
//       if (!typingUsersByRoom.has(room)) {
//         typingUsersByRoom.set(room, new Set());
//       }

//       const roomTypingUsers = typingUsersByRoom.get(room);

//       if (isTyping) {
//         roomTypingUsers?.add(socket.userID as string);
//       } else {
//         roomTypingUsers?.delete(socket.userID as string);
//       }

//       io.in(room).emit("typing", {
//         userID: socket.userID,
//         isTyping,
//         typingUsers: [...(roomTypingUsers || [])],
//       });
//     });

//     ////////////////////////////////////////////////////
//     // Disconnect event
//     ////////////////////////////////////////////////////
//     socket.on("disconnect", () => {
//       // Remove the user from the online users map
//       const roomOnlineUsers = onlineUsersIdByRoom.get(room);
//       if (roomOnlineUsers) {
//         roomOnlineUsers.delete(socket.userID as string);
//         if (roomOnlineUsers.size === 0) {
//           onlineUsersIdByRoom.delete(room);
//         }
//       }
//       io.in(room).emit("userLeft", {
//         onlineUsersID: roomOnlineUsers ? [...roomOnlineUsers] : [],
//         userId: socket.userID,
//       });

//       // Remove the user from the typing users map
//       const roomTypingUsers = typingUsersByRoom.get(room);
//       if (roomTypingUsers) {
//         roomTypingUsers.delete(socket.userID as string);
//         if (roomTypingUsers.size === 0) {
//           typingUsersByRoom.delete(room);
//         }
//       }
//       io.in(room).emit("typing", {
//         userID: socket.userID,
//         isTyping: false,
//         typingUsers: [...(roomTypingUsers || [])],
//       });
//     });

//     // Global socket error handling
//     socket.on("error", (error) => {
//       console.error("Socket error: ", error.message);
//       socket.emit("error", "An unexpected error occurred");
//     });
//   });
// }
