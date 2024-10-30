import express, { Application, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import Routes from "./routes/index.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { setupSocket } from "./socket.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { redisClient, connectRedisClient } from "./config/redis.config.js";
import { instrument } from "@socket.io/admin-ui";
import { connectKafka } from "./config/kafka.config.js";
import { checkEnvVariables, kafkaConsumeMessage } from "./helper.js";
import morgan from "morgan";

// * Check Required Environment Variables
checkEnvVariables();

// * Express App
const app: Application = express();
const PORT = process.env.PORT || 7000;
const server = createServer(app);
const NODE_ENV = process.env.NODE_ENV || "dev";
const morganFormat = NODE_ENV === "production" ? "combined" : "dev";

// * Redis Connection
connectRedisClient();

// * Kafka Connection
connectKafka();
kafkaConsumeMessage(process.env.KAFKA_TOPIC);

// * Socket.io
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_APP_URL, "https://admin.socket.io"],
    credentials: true,
  },
  adapter: createAdapter(redisClient),
  // maxHttpBufferSize: 5 * 1024 * 1024,
});

// * Socket Error Handling
io.on("error", (error) => {
  console.error("Socket.IO Error: ", error);
});

// * Socket.io Admin UI
instrument(io, {
  auth: false,
  mode: "development",
});

// * Setup Socket
setupSocket(io);
export { io };

// * Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(morganFormat));

app.get("/", (req: Request, res: Response) => {
  return res.send("It's working 🙌");
});

// * Routes
app.use("/api", Routes);
server.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
