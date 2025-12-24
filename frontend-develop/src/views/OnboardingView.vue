<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Utensils, ChevronLeft, ChevronRight } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import Checkbox from "@/components/ui/Checkbox.vue";
import { useOnboardingStore } from "@/stores/onboarding";
import userApi from "@/api/user";

const router = useRouter();
const store = useOnboardingStore();

const currentStep = ref(1);
const totalSteps = 3;

const otherDisease = ref("");
const otherGoal = ref("");

const diseaseOptions = [
  { id: "diabetes", label: "당뇨" },
  { id: "hypertension", label: "고혈압" },
  { id: "hyperlipidemia", label: "고지혈증" },
  { id: "other", label: "기타" },
];

const goalOptions = [
  { id: "weight-loss", label: "체중 감량" },
  { id: "maintain", label: "체중 유지" },
  { id: "muscle-gain", label: "근육 증가" },
  { id: "disease-management", label: "질환 관리" },
  { id: "other", label: "기타" },
];

const activityOptions = [
  {
    id: "LOW",
    label: "낮음",
    description: "하루 대부분 앉아서 생활해요",
  },
  {
    id: "MODERATE",
    label: "보통",
    description: "가벼운 활동이나 주 1~2회 운동을 해요",
  },
  {
    id: "HIGH",
    label: "높음",
    description: "하루 활동량이 많거나 주 3회 이상 운동해요",
  },
];

const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 1:
      return "신체 정보를 알려주세요";
    case 2:
      return "건강 목표를 설정해주세요";
    case 3:
      return "활동량을 알려주세요";
    default:
      return "";
  }
});

const stepDescription = computed(() => {
  switch (currentStep.value) {
    case 1:
      return "정확한 분석을 위해 생년월일, 키와 몸무게가 필요해요.";
    case 2:
      return "어떤 건강 관리를 원하시나요?";
    case 3:
      return "하루 활동량에 따라 권장 칼로리가 달라져요.";
    default:
      return "";
  }
});

const handleDiseaseChange = (diseaseId: string, checked: boolean) => {
  store.toggleDisease(diseaseId);
  if (!checked && diseaseId === "other") {
    otherDisease.value = "";
  }
};

const handleGoalChange = (goalId: string, checked: boolean) => {
  store.toggleGoal(goalId);
  if (!checked && goalId === "other") {
    otherGoal.value = "";
  }
};

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  } else {
    handleSubmit();
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const goalMap: Record<string, string> = {
    'weight-loss': '체중 감량',
    'maintain': '체중 유지',
    'muscle-gain': '근육 증가',
    'disease-management': '질환 관리',
};

const handleSubmit = async () => {
  try {
      // 유효성 검사
      if (!store.birthDate) {
          alert("생년월일을 입력해주세요.");
          return;
      }

      const heightNum = Number(store.height);
      const weightNum = Number(store.weight);
      const targetWeightNum = Number(store.targetWeight);

      if (!store.height || isNaN(heightNum) || heightNum <= 0) {
          alert("키를 올바르게 입력해주세요.");
          return;
      }

      if (!store.weight || isNaN(weightNum) || weightNum <= 0) {
          alert("현재 몸무게를 올바르게 입력해주세요.");
          return;
      }

      if (!store.targetWeight || isNaN(targetWeightNum) || targetWeightNum <= 0) {
          alert("목표 몸무게를 올바르게 입력해주세요.");
          return;
      }

      // 1. Goal Mapping
      let selectedGoal: string | null = null;
      const foundId = store.goals.find(g => ['weight-loss', 'maintain', 'muscle-gain', 'disease-management'].includes(g));
      
      if (foundId) {
          selectedGoal = goalMap[foundId] || foundId;
      } else if (store.goals.includes('other')) {
          selectedGoal = otherGoal.value;
      }

      // Ensure activityLevel is uppercase
      const activityLevelValue = store.activityLevel.toUpperCase();

      const payload: any = {
          birthDate: store.birthDate,
          height: heightNum,
          weight: weightNum,
          goalWeight: targetWeightNum,
          activityLevel: activityLevelValue,
          hasDiabetes: store.diseases.includes('diabetes'),
          hasHypertension: store.diseases.includes('hypertension'),
          hasHyperlipidemia: store.diseases.includes('hyperlipidemia'),
          otherDisease: store.diseases.includes('other') ? (otherDisease.value || null) : null,
          goal: selectedGoal
      };

      console.log('Onboarding payload:', payload);
      await userApi.updateMyHealthInfo(payload);
      
      // Reset store? Optional.
      // store.reset();

      // Proceed
      router.push("/dashboard");

  } catch (e: any) {
      console.error("Onboarding saving failed", e);
      const errorData = e.response?.data;
      const errorMessage = errorData?.message || e.message || "알 수 없는 오류";
      console.error("Error details:", errorData);
      console.error("Full error response:", e.response);
      
      // 서버에서 더 자세한 에러 메시지가 있는지 확인
      let alertMessage = `정보 저장에 실패했습니다: ${errorMessage}`;
      if (errorData?.errors) {
          const errorList = Object.entries(errorData.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
          alertMessage += `\n\n상세 오류:\n${errorList}`;
      }
      
      alert(alertMessage);
  }
};

const handleSkip = () => {
  router.push("/dashboard");
};
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-8">
    <div class="w-full max-w-2xl space-y-8">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="relative">
          <div
            class="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 blur-xl opacity-30"
          ></div>
          <div
            class="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center"
          >
            <Utensils class="w-6 h-6 text-white" />
          </div>
        </div>
        <span class="text-3xl text-white">냠냠코치</span>
      </div>

      <!-- Header -->
      <div class="text-center space-y-3">
        <h1 class="text-white text-3xl font-bold">{{ stepTitle }}</h1>
        <p class="text-zinc-400">
          {{ stepDescription }} <span class="text-emerald-400">(Step {{ currentStep }}/{{ totalSteps }})</span>
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-emerald-500 transition-all duration-300 ease-out"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>

      <!-- Form Steps -->
      <div class="space-y-6 min-h-[300px]">
        <!-- Step 1: Basic Info -->
        <div v-if="currentStep === 1" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div class="space-y-2">
            <Label class="text-zinc-300">생년월일</Label>
            <Input
              type="date"
              v-model="store.birthDate"
              class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              :max="new Date().toISOString().split('T')[0]"
            />
            <p class="text-xs text-zinc-500">정확한 건강 분석을 위해 필요해요.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-zinc-300">키</Label>
              <div class="relative">
                <Input
                  type="number"
                  placeholder="예: 170"
                  v-model="store.height"
                  class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 pr-12"
                />
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">cm</div>
              </div>
            </div>

            <div class="space-y-2">
              <Label class="text-zinc-300">현재 몸무게</Label>
              <div class="relative">
                <Input
                  type="number"
                  placeholder="예: 65"
                  v-model="store.weight"
                  class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 pr-12"
                />
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">kg</div>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label class="text-zinc-300">목표 몸무게</Label>
            <div class="relative">
              <Input
                type="number"
                placeholder="예: 60"
                v-model="store.targetWeight"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 pr-12"
              />
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">kg</div>
            </div>
            <p class="text-xs text-zinc-500">건강한 감량 속도를 추천해 드릴게요.</p>
          </div>
        </div>

        <!-- Step 2: Diseases & Goals -->
        <div v-if="currentStep === 2" class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <!-- Diseases -->
          <div class="space-y-3">
            <Label class="text-zinc-300 text-lg">질병 여부</Label>
            <div class="grid grid-cols-2 gap-x-8 gap-y-3">
              <div v-for="option in diseaseOptions" :key="option.id" class="space-y-2">
                <div class="flex items-center space-x-3">
                  <Checkbox
                    :id="option.id"
                    :checked="store.diseases.includes(option.id)"
                    @update:checked="(checked) => handleDiseaseChange(option.id, checked)"
                    class="border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label :for="option.id" class="text-zinc-300 cursor-pointer">{{ option.label }}</label>
                </div>
              </div>
            </div>
            <Input
              v-if="store.diseases.includes('other')"
              type="text"
              placeholder="직접 입력"
              v-model="otherDisease"
              class="h-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 mt-2"
            />
          </div>

          <!-- Goals -->
          <div class="space-y-3">
            <Label class="text-zinc-300 text-lg">건강 목표</Label>
            <div class="grid grid-cols-2 gap-x-8 gap-y-3">
              <div v-for="option in goalOptions" :key="option.id" class="space-y-2">
                <div class="flex items-center space-x-3">
                  <Checkbox
                    :id="`goal-${option.id}`"
                    :checked="store.goals.includes(option.id)"
                    @update:checked="(checked) => handleGoalChange(option.id, checked)"
                    class="border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label :for="`goal-${option.id}`" class="text-zinc-300 cursor-pointer">{{ option.label }}</label>
                </div>
              </div>
            </div>
            <Input
              v-if="store.goals.includes('other')"
              type="text"
              placeholder="직접 입력"
              v-model="otherGoal"
              class="h-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 mt-2"
            />
          </div>
        </div>

        <!-- Step 3: Activity Level -->
        <div v-if="currentStep === 3" class="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <button
            v-for="option in activityOptions"
            :key="option.id"
            @click="store.setActivityLevel(option.id)"
            :class="[
              'w-full px-4 py-4 rounded-lg border transition-all text-left group',
              store.activityLevel === option.id
                ? 'bg-emerald-500 border-emerald-500'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <div :class="[store.activityLevel === option.id ? 'text-white' : 'text-zinc-300']">
                  {{ option.label }}
                </div>
                <div :class="['text-sm', store.activityLevel === option.id ? 'text-white/80' : 'text-zinc-500']">
                  {{ option.description }}
                </div>
              </div>
              <div
                :class="[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  store.activityLevel === option.id
                    ? 'border-white bg-white'
                    : 'border-zinc-600 group-hover:border-zinc-500',
                ]"
              >
                <div v-if="store.activityLevel === option.id" class="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex gap-3 pt-4">
        <Button
          v-if="currentStep > 1"
          variant="outline"
          @click="prevStep"
          class="flex-1 h-12 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <ChevronLeft class="w-4 h-4 mr-2" /> 이전
        </Button>

        <Button
          @click="nextStep"
          class="flex-[2] h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20"
        >
          {{ currentStep === totalSteps ? "완료하고 시작하기" : "다음" }}
          <ChevronRight v-if="currentStep < totalSteps" class="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div class="text-center">
        <button @click="handleSkip" class="text-sm text-zinc-500 hover:text-zinc-300 underline">건너뛰기</button>
      </div>
    </div>
  </div>
</template>
