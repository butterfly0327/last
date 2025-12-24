import api from "@/api/axios";

const BASE_URL = "/ai/chatbot";

// Types
export type ChatRole = "USER" | "ASSISTANT";
export type ChatJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "COMPLETE";

export interface ChatMessage {
  messageId: number;
  role: ChatRole;
  content: string;
  createdAt: string;
  status: ChatJobStatus;
  errorMessage?: string | null;
}

export interface GreetingResponse {
  conversationId: number;
  assistantMessage: ChatMessage;
}

export interface ChatConversation {
  conversationId: number;
  messages: ChatMessage[];
}

export interface CreateChatJobResponse {
  assistantMessageId: number;
  conversationId: number;
  jobId: number;
  status: ChatJobStatus;
}

export interface ChatJobStatusResponse {
  jobId: number;
  status: ChatJobStatus;
  assistantMessageId?: number;
  assistantStatus?: ChatJobStatus;
  content?: string;
  conversationId?: number;
  errorMessage?: string | null;
  result?: any;
}

const chatbotApi = {
  // 1. 초기 대화 생성 (Greeting)
  createGreetingConversation: async () => {
    // API returns { assistantMessage: {...}, conversationId: 6 }
    const response = await api.post<GreetingResponse>(`${BASE_URL}/conversations/greetings`);
    return response.data;
  },

  // 2. 질문 생성 및 Job 발행
  createChatJob: async (question: string, conversationId: number) => {
    const response = await api.post<CreateChatJobResponse>(`${BASE_URL}/questions`, {
      question,
      conversationId,
    });
    return response.data;
  },

  // 3. Job 상태 폴링
  getJobStatus: async (jobId: string) => {
    const response = await api.get<ChatJobStatusResponse>(`${BASE_URL}/jobs/${jobId}`);
    return response.data;
  },

  // 4. 대화 메시지 조회 (완료 후)
  getConversationMessages: async (conversationId: string | number) => {
    const response = await api.get<ChatConversation>(`${BASE_URL}/conversations/${conversationId}/messages`);
    return response.data;
  },
};

export default chatbotApi;
