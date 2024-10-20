import { CHAT_GROUP_URL, CHAT_GROUP_USERS_URL } from "@/lib/apiEndpoints";

////////////////////////////////////////////////////
// To fetch all chat rooms
////////////////////////////////////////////////////
export async function fetchChatGroups(token: string) {
  try {
    const res = await fetch(CHAT_GROUP_URL, {
      headers: {
        Authorization: token,
      },
      next: {
        revalidate: 60 * 60, // 1 hour
        tags: ["dashboard"],
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const response = await res.json();
    if (response?.data) {
      return response?.data;
    }
    return [];
  } catch (error) {
    return [];
  }
}

////////////////////////////////////////////////////
// To fetch a chat room
////////////////////////////////////////////////////
export async function fetchChatGroup(id: string) {
  try {
    const res = await fetch(`${CHAT_GROUP_URL}/${id}`, {
      cache: "no-cache",
      next: {
        revalidate: 60 * 60, // 1 hour
        tags: ["dashboard"],
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const response = await res.json();
    if (response?.data) {
      return response?.data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

////////////////////////////////////////////////////
// To fetch all users in a chat room
////////////////////////////////////////////////////
export async function fetchChatUsers(id: string) {
  try {
    const res = await fetch(`${CHAT_GROUP_USERS_URL}?group_id=${id}`, {
      cache: "no-cache",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const response = await res.json();
    if (response?.data) {
      return response?.data;
    }
    return [];
  } catch (error) {
    return [];
  }
}
