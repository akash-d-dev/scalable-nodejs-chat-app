import prisma from "./config/db.config.js";
import { consumer, producer } from "./config/kafka.config.js";

////////////////////////////////////////////////////////////
// To send a message to specified Kafka topic
////////////////////////////////////////////////////////////
export const kafkaProduceMessage = async (topic: string, message: string) => {
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
        try {
          const data = JSON.parse(message.value.toString());

          await prisma.chats.create({
            data: data,
          });
        } catch (error) {
          console.error("Error processing message:", error);
        }
      },
    });
  } catch (error) {
    console.error("Error setting up consumer:", error);
  }
};
