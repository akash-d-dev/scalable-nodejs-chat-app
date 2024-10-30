import { prisma, supabase } from "./config/db.config.js";
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
          file_url,
          has_file,
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
              file_url: file_url,
              has_file: has_file,
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
// To save an image to Supabase storage
////////////////////////////////////////////////////////////
export const saveImage = async (
  imageUrl: string,
  groupId: string,
  userId: string,
  fileName: string
) => {
  try {
    // Extract the base64 image
    const base64Image = imageUrl.split(",")[1];
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Get the content type from the base64 data
    const mimeType = imageUrl.split(";")[0].split(":")[1];
    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedImageTypes.includes(mimeType)) {
      throw new Error(
        "Invalid image type. Only JPEG, PNG and JPG are allowed."
      );
    }

    // Validate the image size
    const allowedSize = 3 * 1024 * 1024; // 3MB
    if (imageBuffer.length > allowedSize) {
      throw new Error("Image exceeds the allowed size.");
    }

    // Construct the file path: groupId/userId/timestamp_userName
    const filePath = `${groupId}/${userId}/${Date.now()}_${fileName}`;

    // Upload image to Supabase bucket
    const { data, error } = await supabase.storage
      .from("chat-images")
      .upload(filePath, imageBuffer);

    if (error) {
      throw new Error("Error uploading image to Supabase");
    }

    // Get the public URL of the uploaded image
    const uploadedImageUrl = supabase.storage
      .from("chat-images")
      .getPublicUrl(data.path).data.publicUrl;

    return uploadedImageUrl; // Return the URL of the uploaded image
  } catch (error) {
    console.error("Error saving image: ", error);
    throw error;
  }
};

////////////////////////////////////////////////////////////
// To delete all images in a group directory from Supabase
////////////////////////////////////////////////////////////
export const deleteImages = async (groupId: string) => {
  try {
    // List all user subdirectories in the group directory
    const { data: userDirs, error: listUserDirsError } = await supabase.storage
      .from("chat-images")
      .list(groupId, { limit: 100, offset: 0 });

    if (listUserDirsError) {
      throw new Error(
        `Error fetching user directories for group ${groupId}: ${listUserDirsError.message}`
      );
    }

    if (userDirs && userDirs.length > 0) {
      // Iterate over user subdirectories to delete all files
      for (const userDir of userDirs) {
        const userDirPath = `${groupId}/${userDir.name}`;

        // List all files in the user directory
        const { data: userFiles, error: listFilesError } =
          await supabase.storage
            .from("chat-images")
            .list(userDirPath, { limit: 100, offset: 0 });

        if (listFilesError) {
          throw new Error(
            `Error fetching files in directory ${userDirPath}: ${listFilesError.message}`
          );
        }

        if (userFiles && userFiles.length > 0) {
          const filePaths = userFiles.map(
            (file) => `${userDirPath}/${file.name}`
          );

          // Remove files from Supabase storage
          const { error: removeError } = await supabase.storage
            .from("chat-images")
            .remove(filePaths);

          if (removeError) {
            throw new Error(
              `Error deleting files in directory ${userDirPath}: ${removeError.message}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in deleteImages function: ", error);
    throw error;
  }
};

////////////////////////////////////////////////////////////
// To validate a URL
////////////////////////////////////////////////////////////
export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
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
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
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
