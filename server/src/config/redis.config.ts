////////////////////////////////////////////////////////////
//For local redis
////////////////////////////////////////////////////////////
// import { Redis } from "ioredis";

// const redisClient = new Redis({
//   host: process.env.REDIS_HOST,
//   port: parseInt(process.env.REDIS_PORT),
//   // password: process.env.REDIS_PASSWORD,
// });

// export default redisClient;

//
//
////////////////////////////////////////////////////////////
//
//

////////////////////////////////////////////////////////////
//For Redis Cloud
////////////////////////////////////////////////////////////
import { createClient } from "redis";

export const redisClient = createClient({
  password: process.env.REDIS_CLOUD_PASSWORD,
  socket: {
    host: process.env.REDIS_CLOUD_HOST,
    port: parseInt(process.env.REDIS_CLOUD_PORT),
  },
});

export const connectRedisClient = async () => {
  redisClient
    .connect()
    .then(() => {
      console.log("Connected to Redis Cloud");
    })
    .catch((err) => {
      console.error("Failed to connect to Redis", err);
    });
};
