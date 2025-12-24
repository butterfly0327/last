<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/api/auth";
import { Eye, EyeOff, Utensils } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import ImageWithFallback from "@/components/common/ImageWithFallback.vue";

const router = useRouter();
const authStore = useAuthStore();

const isLogin = ref(true);
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const name = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const flashMessage = ref<{ type: "error" | "success"; message: string } | null>(null);

onMounted(() => {
  try {
    const raw = sessionStorage.getItem("flash_message");
    if (!raw) return;
    sessionStorage.removeItem("flash_message");
    const parsed = JSON.parse(raw) as { type?: unknown; message?: unknown };
    if (typeof parsed?.message === "string") {
      flashMessage.value = {
        type: parsed.type === "success" ? "success" : "error",
        message: parsed.message,
      };
    }
  } catch {
    // ignore
  }
});

// Email Check State
const isEmailChecked = ref(false);
const isEmailAvailable = ref(false);
const emailCheckMessage = ref("");

// Nickname Check State
const isNicknameChecked = ref(false);
const isNicknameAvailable = ref(false);
const nicknameCheckMessage = ref("");

const checkNickname = async () => {
  if (!name.value) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  try {
    const response = await api.isUsernameAvailable(name.value);
    isNicknameAvailable.value = response.data.available;
    isNicknameChecked.value = true;

    if (isNicknameAvailable.value) {
      nicknameCheckMessage.value = "사용 가능한 닉네임입니다.";
    } else {
      nicknameCheckMessage.value = "이미 사용 중인 닉네임입니다.";
    }
  } catch (error: any) {
    console.error(error);
    alert("닉네임 중복 확인 중 오류가 발생했습니다.");
  }
};

// Reset check when nickname changes
const handleNicknameChange = () => {
  isNicknameChecked.value = false;
  isNicknameAvailable.value = false;
  nicknameCheckMessage.value = "";
};

const checkEmail = async () => {
  if (!email.value) {
    alert("이메일을 입력해주세요.");
    return;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    alert("올바른 이메일 형식이 아닙니다.");
    return;
  }

  try {
    const response = await api.isEmailAvailable(email.value);
    // Adjust based on actual API response structure. 
    // Assuming response.data.available is boolean.
    isEmailAvailable.value = response.data.available;
    isEmailChecked.value = true;

    if (isEmailAvailable.value) {
      emailCheckMessage.value = "사용 가능한 이메일입니다.";
    } else {
      emailCheckMessage.value = "이미 사용 중인 이메일입니다.";
    }
  } catch (error: any) {
    console.error(error);
    alert("이메일 중복 확인 중 오류가 발생했습니다.");
  }
};

// Reset check when email changes
const handleEmailChange = () => {
  isEmailChecked.value = false;
  isEmailAvailable.value = false;
  emailCheckMessage.value = "";
};

const handleSubmit = async () => {
  try {
    if (isLogin.value) {
      await authStore.login({ email: email.value, password: password.value });
      router.push("/dashboard");
    } else {
      // Validate Signup
      if (!isEmailChecked.value || !isEmailAvailable.value) {
        alert("이메일 중복 확인을 해주세요.");
        return;
      }

      if (!isNicknameChecked.value || !isNicknameAvailable.value) {
        alert("닉네임 중복 확인을 해주세요.");
        return;
      }

      if (password.value !== confirmPassword.value) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }
      
      await api.signUp({ 
        email: email.value, 
        password: password.value, 
        username: name.value 
      });

      // 회원가입 후 자동 로그인
      await authStore.login({ email: email.value, password: password.value });

      alert("회원가입이 완료되었습니다.\n초기 설정을 위해 온보딩 페이지로 이동합니다.");
      // 회원가입 성공 시 온보딩 페이지로 이동
      router.push("/onboarding");
      isLogin.value = true;
    }
  } catch (error: any) {
    alert(error.message || "작업 중 오류가 발생했습니다.");
  }
};
</script>

<template>
  <div class="min-h-screen w-full flex">
    <!-- Left side - Brand & Image -->
    <div
      class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden"
    >
      <div class="absolute inset-0 bg-black/20"></div>
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc2MzEzNTQ0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        alt="Healthy food"
        class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
      />

      <div class="relative z-10 flex flex-col justify-center px-16 text-white">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
            <Utensils class="w-5 h-5" />
            <span class="text-sm">건강한 식단 관리</span>
          </div>

          <div class="space-y-4">
            <h1 class="text-6xl tracking-tight">냠냠코치</h1>
            <p class="text-2xl text-white/90">
              AI로 식단을 분석하고
              <br />
              건강 루틴을 관리해요
            </p>
          </div>

          <div class="pt-8 space-y-4">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
              >
                <span>✓</span>
              </div>
              <div>
                <p class="text-white/90">AI 기반 영양 분석으로 정확한 칼로리와 영양소를 추적해요</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
              >
                <span>✓</span>
              </div>
              <div>
                <p class="text-white/90">개인 맞춤형 식단 추천으로 건강한 식습관을 만들어요</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
              >
                <span>✓</span>
              </div>
              <div>
                <p class="text-white/90">운동 루틴과 연동하여 종합적인 건강 관리를 제공해요</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Login/Signup Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-950">
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <Utensils class="w-6 h-6 text-emerald-500" />
          <span class="text-2xl text-white">냠냠코치</span>
        </div>

        <!-- Header -->
        <div class="space-y-2">
          <h1 class="text-4xl text-white">{{ isLogin ? "로그인" : "회원가입" }}</h1>
          <p class="text-zinc-400">{{ isLogin ? "계정에 로그인하세요" : "새로운 계정을 만드세요" }}</p>
        </div>

        <!-- Flash Message (ex: session expired) -->
        <div
          v-if="flashMessage"
          class="rounded-lg border px-4 py-3 text-sm"
          :class="
            flashMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          "
        >
          {{ flashMessage.message }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div v-if="!isLogin" class="space-y-2">
            <Label class="text-zinc-300"> 닉네임 </Label>
            <div class="flex gap-2">
              <Input
                type="text"
                placeholder="홍길동"
                v-model="name"
                @input="handleNicknameChange"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 flex-1"
                :required="!isLogin"
              />
              <Button 
                type="button" 
                @click="checkNickname"
                variant="outline"
                class="h-12 whitespace-nowrap bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                중복 확인
              </Button>
            </div>
            <!-- Validation Message -->
             <p v-if="nicknameCheckMessage" 
               class="text-sm"
               :class="isNicknameAvailable ? 'text-emerald-500' : 'text-red-500'"
            >
              {{ nicknameCheckMessage }}
            </p>
          </div>

          <div class="space-y-2">
            <Label class="text-zinc-300"> 이메일 </Label>
            <div class="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                v-model="email"
                @input="handleEmailChange"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 flex-1"
                required
              />
              <Button 
                v-if="!isLogin"
                type="button" 
                @click="checkEmail"
                variant="outline"
                class="h-12 whitespace-nowrap bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                중복 확인
              </Button>
            </div>
            <!-- Validation Message -->
            <p v-if="!isLogin && emailCheckMessage" 
               class="text-sm"
               :class="isEmailAvailable ? 'text-emerald-500' : 'text-red-500'"
            >
              {{ emailCheckMessage }}
            </p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-zinc-300"> 비밀번호 </Label>
              <a v-if="isLogin" href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">
                비밀번호 찾기
              </a>
            </div>
            <div class="relative">
              <Input
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                v-model="password"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 pr-12"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <EyeOff v-if="showPassword" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div v-if="!isLogin" class="space-y-2">
            <Label class="text-zinc-300"> 비밀번호 확인 </Label>
            <div class="relative">
              <Input
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                v-model="confirmPassword"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 pr-12"
                :required="!isLogin"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <EyeOff v-if="showConfirmPassword" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <Button type="submit" class="w-full h-12 bg-white text-black hover:bg-zinc-200">
            {{ isLogin ? "로그인" : "회원가입" }}
          </Button>
        </form>

        <!-- Toggle between login/signup -->
        <div class="text-center">
          <p v-if="isLogin" class="text-zinc-400">
            아직 가입 안하셨나요?
            <button @click="isLogin = false" class="text-white hover:underline">회원가입</button>
          </p>
          <p v-else class="text-zinc-400">
            이미 계정이 있으신가요?
            <button @click="isLogin = true" class="text-white hover:underline">로그인</button>
          </p>
        </div>

        <div v-if="isLogin" class="text-center text-sm text-zinc-500">
          계속 진행하면
          <a href="#" class="text-zinc-400 hover:text-white underline"> 서비스 약관 </a>
          및
          <a href="#" class="text-zinc-400 hover:text-white underline"> 개인정보 처리방침 </a>
          에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  </div>
</template>
