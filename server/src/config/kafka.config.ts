import { Kafka, logLevel } from "kafkajs";
import fs from "fs";

// Load the CA certificate
const caPath = process.env.KAFKA_CA_PATH as string;
const sslCa = [fs.readFileSync(caPath, "utf-8")];

export const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER as string],
  ssl: {
    rejectUnauthorized: true, // Ensure the client verifies the certificate
    ca: sslCa,
  },
  sasl: {
    mechanism: "scram-sha-256",
    username: process.env.KAFKA_USERNAME as string,
    password: process.env.KAFKA_PASSWORD as string,
  },
  logLevel: logLevel.ERROR,
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID });

export const connectKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();

    console.log("Connected to Kafka 🚀");
  } catch (err) {
    console.error("Error connecting to Kafka:", err);
  }
};
