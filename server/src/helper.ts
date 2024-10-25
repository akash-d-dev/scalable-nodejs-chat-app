import prisma from "./config/db.config.js";
import { consumer, producer } from "./config/kafka.config.js";

////////////////////////////////////////////////////////////
// To send a message to specified Kafka topic
////////////////////////////////////////////////////////////
export const kafkaProduceMessage = async (topic: string, message: string) => {
  console.log("Sending message to Kafka topic:", topic);
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

////////////////////////////////////////////////////////////
// To consume a message from specified Kafka topic
////////////////////////////////////////////////////////////
export const kafkaConsumeMessage = async (topic: string) => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageValue = message.value?.toString();

        if (!messageValue) {
          console.error("Received null or undefined message");
          return;
        }

        let data: any;
        try {
          data = JSON.parse(messageValue);
          console.log({
            partition,
            offset: message.offset,
            value: data,
          });
        } catch (error) {
          console.error("Error parsing message:", error);
          return; // Early return, stop further processing
        }

        const {
          message: msgContent,
          name,
          created_at,
          group_id,
          user_id,
        } = data;

        try {
          // Insert into the database using prisma.chats.create
          await prisma.chats.create({
            data: {
              message: msgContent,
              name: name,
              created_at: created_at,
              group_id: group_id,
              user_id: user_id,
            },
          });
        } catch (error) {
          console.error("Error saving message to DB:", error);
        }
      },
    });
  } catch (error) {
    console.error("Error setting up consumer:", error);
  }
};

////////////////////////////////////////////////////////////
// To check required environment variables
////////////////////////////////////////////////////////////
export const checkEnvVariables = () => {
  const requiredEnvVars = [
    "PORT",
    "JWT_SECRET",
    "CLIENT_APP_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_CLOUD_HOST",
    "REDIS_CLOUD_PASSWORD",
    "REDIS_CLOUD_PORT",
    "KAFKA_BROKER",
    "KAFKA_USERNAME",
    "KAFKA_PASSWORD",
    "KAFKA_TOPIC",
    "KAFKA_GROUP_ID",
    "KAFKA_CA_PATH",
    "DATABASE_URL",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `
      ********************************************************************
      Missing required environment variables: ${missingEnvVars.join(", ")}
      ********************************************************************
      `
    );
  }

  console.log("All required environment variables are set!");
};
