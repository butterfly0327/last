<script setup lang="ts">
import { ref, nextTick } from "vue";
import { Send, Sparkles, User, Bot, X } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import chatbotApi, { type ChatMessage } from "@/api/aichatbot";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const isOpen = ref(false);
const messages = ref<Message[]>([]);
const conversationId = ref<string | number | null>(null);
const userInput = ref("");
const isTyping = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
    // 처음 열릴 때 대화 ID가 없으면 초기화 시도
    if (!conversationId.value && messages.value.length === 0) {
        initializeChat();
    }
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const SESSION_KEY = "chat_conversation_id";
const JOB_SESSION_KEY = "chat_active_job_id";

const initializeChat = async () => {
  try {
    isTyping.value = true;
    const storedId = sessionStorage.getItem(SESSION_KEY);

    if (storedId) {
      // 1. 기존 대화 복구
      conversationId.value = storedId;
      const res = await chatbotApi.getConversationMessages(storedId);
      if (res.messages && res.messages.length > 0) {
        messages.value = res.messages.map((msg: ChatMessage) => ({
          id: String(msg.messageId),
          role: msg.role === "ASSISTANT" ? "assistant" : "user",
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }));
      }
    } else {
      // 2. 새 대화 시작 (Greeting)
      const res = await chatbotApi.createGreetingConversation();
      if (res && res.conversationId) {
        conversationId.value = res.conversationId;
        sessionStorage.setItem(SESSION_KEY, String(res.conversationId));

        if (res.assistantMessage) {
          const msg = res.assistantMessage;
          messages.value.push({
            id: String(msg.messageId),
            role: "assistant", // Greeting is always assistant
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    // 에러 시 세션 스토리지 클리어 고려 (잘못된 ID일 수 있음)
    // sessionStorage.removeItem(SESSION_KEY);
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

// Job 상태 폴링
const pollJobStatus = async (jobId: string) => {
  const POLLING_INTERVAL = 1000; // 1초
  const MAX_ATTEMPTS = 60; // 최대 60초 대기

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const res = await chatbotApi.getJobStatus(jobId);
      if (res.status === "COMPLETED") {
        return res; // 성공 시 전체 응답 반환 (content 포함)
      } else if (res.status === "FAILED") {
        throw new Error(res.errorMessage || "Job failed");
      }
      // PENDING or PROCESSING: 계속 대기
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    } catch (e) {
      console.error("Polling error:", e);
    }
  }
  throw new Error("Timeout awaiting job completion");
};

const sendMessage = async () => {
  if (!userInput.value.trim() || !conversationId.value) return;

  const content = userInput.value;
  userInput.value = "";

  // 1. 유저 메시지 즉시 표시
  const userMsg: Message = {
    id: `temp-${Date.now()}`,
    role: "user",
    content: content,
    timestamp: new Date(),
  };
  messages.value.push(userMsg);
  scrollToBottom();

  isTyping.value = true;

  try {
    // 2. 질문 생성 및 Job 발행
    const res = await chatbotApi.createChatJob(content, Number(conversationId.value));
    const jobId = String(res.jobId);
    
    // 세션 스토리지에 Job ID 저장 (새로고침 시 복구용)
    sessionStorage.setItem(JOB_SESSION_KEY, jobId);

    // 3. Job 상태 폴링 (완료 시 응답 받음)
    const jobResult = await pollJobStatus(jobId);

    // 4. 완료 시 응답 메시지 바로 표시 (추가 조회 불필요)
    if (jobResult && jobResult.content) {
      messages.value.push({
        id: String(jobResult.assistantMessageId || Date.now()),
        role: "assistant",
        content: jobResult.content,
        timestamp: new Date(), // API에 생성 시각이 있다면 사용, 없으면 현재
      });
    } else {
        // 만약 content가 없다면(드물겠지만) 전체 조회로 폴백
        const convRes = await chatbotApi.getConversationMessages(Number(conversationId.value));
        const lastMsg = convRes.messages[convRes.messages.length - 1];
        if (lastMsg && lastMsg.role === 'ASSISTANT') {
             messages.value.push({
                id: String(lastMsg.messageId),
                role: "assistant",
                content: lastMsg.content,
                timestamp: new Date(lastMsg.createdAt)
             });
        }
    }

  } catch (error) {
    console.error("Chat error:", error);
    messages.value.push({
      id: `err-${Date.now()}`,
      role: "assistant",
      content: "죄송합니다. 답변을 생성하는 중에 오류가 발생했어요.",
      timestamp: new Date(),
    });
  } finally {
    isTyping.value = false;
    sessionStorage.removeItem(JOB_SESSION_KEY); // 완료 후 삭제
    scrollToBottom();
  }
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

// 컴포넌트 마운트 시에는 자동 실행 하지 않고, 사용자가 위젯을 열었을 때 실행하도록 변경 (또는 항상 미리 로드)
// onMounted(() => {
//   initializeChat();
// });
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
    <!-- Chat Window -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isOpen"
        class="w-[360px] h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <header class="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Sparkles class="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h1 class="text-sm text-white font-semibold">AI 코치</h1>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[10px] text-zinc-400">상담 가능</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" class="w-8 h-8 text-zinc-400 hover:text-white" @click="toggleChat">
            <X class="w-4 h-4" />
          </Button>
        </header>

        <!-- Chat Area -->
        <main ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-zinc-950/50">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex gap-3"
            :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
          >
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div
                v-if="msg.role === 'assistant'"
                class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
              >
                <Bot class="w-4 h-4 text-emerald-500" />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700"
              >
                <User class="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            <!-- Message Content -->
            <div class="flex flex-col gap-1 max-w-[75%]" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
              <div
                class="px-3 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm"
                :class="
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
                "
              >
                {{ msg.content }}
              </div>
              <span class="text-[10px] text-zinc-500 px-1">
                {{ formatTime(msg.timestamp) }}
              </span>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="flex gap-3">
            <div
              class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
            >
              <Bot class="w-4 h-4 text-emerald-500" />
            </div>
            <div
              class="bg-zinc-800 border border-zinc-700 px-3 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1"
            >
              <span class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </div>
          </div>
        </main>

        <!-- Input Area -->
        <footer class="p-3 bg-zinc-900 border-t border-zinc-800 flex-shrink-0">
          <form @submit.prevent="sendMessage" class="relative flex items-center gap-2">
            <div class="relative flex-1">
              <input
                v-model="userInput"
                type="text"
                placeholder="궁금한 점을 물어보세요..."
                class="w-full bg-zinc-800 text-white placeholder:text-zinc-500 border border-zinc-700 rounded-full px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <Button
                type="submit"
                size="icon"
                :disabled="!userInput.trim() || isTyping"
                class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send class="w-4 h-4" />
              </Button>
            </div>
          </form>
        </footer>
      </div>
    </transition>

    <!-- Floating Action Button -->
    <button
      @click="toggleChat"
      class="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
    >
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 rotate-90 scale-50"
        enter-to-class="opacity-100 rotate-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 rotate-0 scale-100"
        leave-to-class="opacity-0 -rotate-90 scale-50"
        mode="out-in"
      >
        <X v-if="isOpen" class="w-7 h-7" />
        <Bot v-else class="w-7 h-7 group-hover:animate-bounce" />
      </transition>
    </button>
  </div>
</template>

<style scoped>
/* Scrollbar Customization */
main::-webkit-scrollbar {
  width: 4px;
}
main::-webkit-scrollbar-track {
  background: transparent;
}
main::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 2px;
}
main::-webkit-scrollbar-thumb:hover {
  background-color: #52525b;
}
</style>
