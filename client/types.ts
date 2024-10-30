type ChatGroupType = {
  id: string;
  user_id: string;
  title: string;
  passcode?: string;
  created_at: string;
};

type GroupChatUserType = {
  id: string;
  name: string;
  group_id: string;
  created_at: string;
};

type ChatMessageType = {
  id?: string;
  message: string;
  group_id: string;
  name: string;
  created_at: string;
  user_id: string;
  has_file?: boolean;
  file_url?: string;
};
