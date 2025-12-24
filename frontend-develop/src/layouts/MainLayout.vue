<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Users,
  Trophy,
  User,
  Utensils,
  Menu,
  X,
  LogOut,
} from "lucide-vue-next";
import Avatar from "@/components/ui/Avatar.vue";
import AICoachWidget from "@/components/AICoachWidget.vue";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isMobileMenuOpen = ref(false);

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard, path: "/dashboard" },
  { id: "meal", label: "식단 기록하기", icon: UtensilsCrossed, path: "/meal-register" },
  { id: "exercise", label: "운동 기록하기", icon: Dumbbell, path: "/exercise-register" },
  { id: "stats", label: "주간 통계", icon: TrendingUp, path: "/stats-analysis" },
  { id: "community", label: "커뮤니티", icon: Users, path: "/community" },
  { id: "challenge", label: "챌린지", icon: Trophy, path: "/challenge-list" },
  { id: "mypage", label: "마이페이지", icon: User, path: "/mypage" },
];

const activeMenu = computed(() => {
  const currentPath = route.path;
  const item = menuItems.find((item) => 
    item.path === currentPath || currentPath.startsWith(`${item.path}/`)
  );
  return item ? item.id : "dashboard";
});

const activeLabel = computed(() => {
  const item = menuItems.find((i) => i.id === activeMenu.value);
  return item ? item.label : "대시보드";
});

const handleMenuClick = (path: string) => {
  router.push(path);
  isMobileMenuOpen.value = false;
};

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: "login" });
  isMobileMenuOpen.value = false;
};

const today = new Date();
const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(
  today.getDate()
).padStart(2, "0")}`;
</script>

<template>
  <div class="min-h-screen bg-zinc-950 flex">
    <!-- 사이드바 - Desktop -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-zinc-900 border-r border-zinc-800">
        <!-- 로고 -->
      <div class="p-6 border-b border-zinc-800 cursor-pointer" @click="router.push('/dashboard')">
        <div class="flex items-center gap-3">
          <Utensils class="w-7 h-7 text-emerald-500" />
          <span class="text-2xl text-white">냠냠코치</span>
        </div>
      </div>

      <!-- 메뉴 -->
      <nav class="flex-1 p-4 space-y-1">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="handleMenuClick(item.path)"
          :class="
            cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
              activeMenu === item.id ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            )
          "
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      
      <!-- 로그아웃 (데스크톱) -->
      <div class="p-4 border-t border-zinc-800">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <LogOut class="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- 모바일 메뉴 -->
    <div v-if="isMobileMenuOpen" class="lg:hidden fixed inset-0 z-50 bg-black/50" @click="isMobileMenuOpen = false">
      <aside class="w-64 h-full flex flex-col bg-zinc-900 border-r border-zinc-800" @click.stop>
        <!-- 로고 -->
        <div class="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" @click="router.push('/dashboard')">
            <Utensils class="w-7 h-7 text-emerald-500" />
            <span class="text-xl text-white">냠냠코치</span>
          </div>
          <button @click="isMobileMenuOpen = false" class="text-zinc-400">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- 메뉴 -->
        <nav class="p-4 space-y-1 flex-1">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="handleMenuClick(item.path)"
            :class="
              cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                activeMenu === item.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              )
            "
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
        
        <!-- 로그아웃 (모바일) -->
        <div class="p-4 border-t border-zinc-800">
            <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
            >
            <LogOut class="w-5 h-5" />
            <span>로그아웃</span>
            </button>
        </div>
      </aside>
    </div>

    <!-- 메인 영역 -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- 헤더 -->
      <header class="bg-zinc-900 border-b border-zinc-800 px-6 py-5 flex-shrink-0">
        <div class="flex items-center justify-between">
          <!-- 좌측 -->
          <div class="flex items-center gap-4">
            <button @click="isMobileMenuOpen = true" class="lg:hidden text-zinc-400 hover:text-white">
              <Menu class="w-6 h-6" />
            </button>
            <h1 class="text-2xl text-white">{{ activeLabel }}</h1>
          </div>

          <!-- 우측 -->
          <div class="flex items-center gap-6">
            <span class="text-zinc-400 hidden sm:block">{{ formattedDate }}</span>
            <div 
              class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
              v-if="authStore.user"
              @click="router.push('/mypage')"
            >
              <Avatar class="w-9 h-9" :fallback="authStore.user.username.slice(0, 1)" class-name="bg-emerald-500 text-white" />
              <span class="text-white hidden sm:block">{{ authStore.user.username }}</span>
            </div>
          </div>
        </div>

      </header>

      <!-- 메인 콘텐츠 -->
      <main class="flex-1 p-6 overflow-y-auto">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </main>
    </div>

    <!-- AI Coach Widget -->
    <AICoachWidget />
  </div>
</template>
