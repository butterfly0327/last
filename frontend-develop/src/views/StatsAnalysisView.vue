<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "vue-chartjs";
import { Loader2 } from "lucide-vue-next";
import Select from "@/components/ui/Select.vue";
import statsApi from "@/api/stats";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

// --- Helpers ---
const formatDateForApi = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (d: Date) => {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
};

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

const addDays = (d: Date, days: number) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
};

// --- State ---
// Week Options: Generate last 4 weeks including current week
const generateWeekOptions = () => {
  const options = [];
  const today = new Date();
  // Start from current week's monday
  let currentMonday = getMonday(today);

  for (let i = 0; i < 4; i++) {
    const start = currentMonday;
    const end = addDays(start, 6);
    const label = `${formatDateForDisplay(start)} ~ ${formatDateForDisplay(end)}`;

    // Change logic: Current week -> Today, Past week -> Sunday (end)
    const value = i === 0 ? formatDateForApi(today) : formatDateForApi(end);

    options.push({ label, value });

    // Go to previous week
    currentMonday = addDays(currentMonday, -7);
  }
  return options;
};

const weekOptions = generateWeekOptions();
const selectedWeek = ref(weekOptions[0].value); // Default to current week

const selectedNutrient = ref("calories");
const selectedExerciseStat = ref("durationMinutes");

const nutrientOptions = [
  { label: "탄수화물", value: "carbs" },
  { label: "단백질", value: "protein" },
  { label: "지방", value: "fat" },
  { label: "칼로리", value: "calories" },
];

const exerciseStatOptions = [
  { label: "운동시간", value: "durationMinutes" },
  { label: "소모칼로리", value: "calories" },
];

// Data State
const isLoading = ref(false);
const rawDietStats = ref<any[]>([]);
const rawExerciseStats = ref<any[]>([]);
const weekRange = ref({ start: "", end: "" });
const nutritionReview = ref<any>(null);
const exerciseReview = ref<any>(null);
const isNutritionReviewLoading = ref(false);
const isExerciseReviewLoading = ref(false);

// Data Check Helpers
const hasDietData = computed(() => {
  return rawDietStats.value.some((d) => Number(d[selectedNutrient.value]) > 0);
});

const hasExerciseData = computed(() => {
  return rawExerciseStats.value.some((d) => Number(d[selectedExerciseStat.value]) > 0);
});

// UI Helpers for Review
const getStatusBadge = (status: string) => {
  switch (status) {
    case "LOW":
      return { text: "부족", class: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" };
    case "ADEQUATE":
      return { text: "적정", class: "bg-emerald-500/20 text-emerald-500 border-emerald-500/50" };
    case "HIGH":
      return { text: "과다", class: "bg-red-500/20 text-red-500 border-red-500/50" };
    default:
      return { text: "-", class: "bg-zinc-800 text-zinc-400 border-zinc-700" };
  }
};

const getExerciseStatusBadge = (status: string) => {
  switch (status) {
    case "LOW":
      return { text: "부족", class: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" };
    case "ADEQUATE":
      return { text: "적정", class: "bg-emerald-500/20 text-emerald-500 border-emerald-500/50" };
    case "HIGH":
      return { text: "많음", class: "bg-blue-500/20 text-blue-500 border-blue-500/50" };
    default:
      return { text: "-", class: "bg-zinc-800 text-zinc-400 border-zinc-700" };
  }
};

const getStatusLabel = (key: string) => {
  const map: Record<string, string> = {
    calorieStatus: "칼로리",
    carbohydrateStatus: "탄수화물",
    proteinStatus: "단백질",
    fatStatus: "지방",
  };
  return map[key] || key;
};

// --- API Fetch ---
const fetchStats = async () => {
  if (!selectedWeek.value) return;
  isLoading.value = true;
  try {
    const [statsRes, reviewRes, exReviewRes] = await Promise.allSettled([
      statsApi.getWeeklyStats(selectedWeek.value),
      statsApi.getNutritionReview(selectedWeek.value),
      statsApi.getExerciseReview(selectedWeek.value),
    ]);

    // Handle Stats
    if (statsRes.status === "fulfilled") {
      const data = statsRes.value.data;
      rawDietStats.value = data.dietStats || [];
      rawExerciseStats.value = data.exerciseStats || [];
      weekRange.value = {
        start: data.weekStartDate,
        end: data.weekEndDate,
      };
    } else {
      console.error("Failed to fetch stats:", statsRes.reason);
      rawDietStats.value = [];
      rawExerciseStats.value = [];
    }

    // Handle Nutrition Review
    const handleNutritionReviewFetch = async () => {
      // 1. Data Check: Do we have any diet data to analyze?
      const hasAnyDietData = (rawDietStats.value || []).some((d: any) => 
        Number(d.calories) > 0 || Number(d.carbs) > 0 || Number(d.protein) > 0 || Number(d.fat) > 0
      );

      if (!hasAnyDietData) {
        nutritionReview.value = null;
        isNutritionReviewLoading.value = false;
        return;
      }

      // Polling Logic
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 2000;

      const isNutritionReviewValid = (review: any) => {
        if (!review || !review.evaluated) return false;

        const lastUpdateTimeStr = localStorage.getItem("LAST_MEAL_UPDATE_TIME");
        if (!lastUpdateTimeStr) return true;

        const lastUpdateTime = new Date(lastUpdateTimeStr).getTime();
        const generatedTime = new Date(review.generatedAt).getTime();

        // If generatedAt is OLDER than last update, it's stale.
        return generatedTime >= lastUpdateTime;
      };

      const poll = async () => {
        try {
          const res = await statsApi.getNutritionReview(selectedWeek.value);
          if (isNutritionReviewValid(res.data)) {
            nutritionReview.value = res.data;
            return true;
          }
        } catch (e) {
          console.warn("Polling nutrition review failed:", e);
        }
        return false;
      };

      // Initial Check
      if (reviewRes.status === "fulfilled" && isNutritionReviewValid(reviewRes.value.data)) {
        nutritionReview.value = reviewRes.value.data;
        isNutritionReviewLoading.value = false;
      } else {
        nutritionReview.value = null; 
        isNutritionReviewLoading.value = true; // Start loading state

        console.log("Starting polling for fresh nutrition review...");
        const interval = setInterval(async () => {
          attempts++;
          const success = await poll();
          if (success || attempts >= maxAttempts) {
            clearInterval(interval);
            isNutritionReviewLoading.value = false; // Stop loading state
            if (success) {
              console.log("Fresh nutrition review fetched via polling!");
            } else console.log("Nutrition Polling timed out.");
          }
        }, pollInterval);
      }
    };

    // Handle Exercise Review
    const handleExerciseReviewFetch = async () => {
      // 1. Data Check
       const hasAnyExerciseData = (rawExerciseStats.value || []).some((d: any) => 
        Number(d.durationMinutes) > 0 || Number(d.calories) > 0
      );

      if (!hasAnyExerciseData) {
        exerciseReview.value = null;
        isExerciseReviewLoading.value = false;
        return;
      }

      // Polling Logic
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 2000;

      // Helper: Check if review is valid (not stale)
      const isReviewValid = (review: any) => {
        if (!review || !review.evaluated) return false;

        const lastUpdateTimeStr = localStorage.getItem("LAST_EXERCISE_UPDATE_TIME");
        if (!lastUpdateTimeStr) return true; // No updates made locally, so existing review is valid

        const lastUpdateTime = new Date(lastUpdateTimeStr).getTime();
        const generatedTime = new Date(review.generatedAt).getTime();

        // If generatedAt is OLDER than last update, it's stale.
        return generatedTime >= lastUpdateTime;
      };

      const poll = async () => {
        try {
          const res = await statsApi.getExerciseReview(selectedWeek.value);
          if (isReviewValid(res.data)) {
            exerciseReview.value = res.data;
            return true;
          }
        } catch (e) {
          console.warn("Polling exercise review failed:", e);
        }
        return false;
      };

      // Initial Check
      // If we have a result AND it counts as valid (newer than last update), use it.
      if (exReviewRes.status === "fulfilled" && isReviewValid(exReviewRes.value.data)) {
        exerciseReview.value = exReviewRes.value.data;
        isExerciseReviewLoading.value = false;
      } else {
        exerciseReview.value = null; 
        isExerciseReviewLoading.value = true; // Use explicit loading state

        // Start Polling
        console.log("Starting polling for fresh exercise review...");
        const interval = setInterval(async () => {
          attempts++;
          const success = await poll();
          if (success || attempts >= maxAttempts) {
            clearInterval(interval);
            isExerciseReviewLoading.value = false; // Stop loading state
            if (success) {
              console.log("Fresh exercise review fetched via polling!");
            } else console.log("Polling timed out.");
          }
        }, pollInterval);
      }
    };

    handleNutritionReviewFetch();
    handleExerciseReviewFetch();
  } catch (error) {
    console.error("Unexpected error:", error);
  } finally {
    isLoading.value = false;
  }
};

// Watch for week change
watch(selectedWeek, () => {
  fetchStats();
});

onMounted(() => {
  fetchStats();
});

// --- Charts ---

// Chart Config
const commonOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "#a1a1aa",
        usePointStyle: false,
        boxHeight: 8,
      },
    },
    tooltip: {
      backgroundColor: "#18181b",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#27272a",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { color: "#27272a" },
      ticks: { color: "#a1a1aa" },
    },
    y: {
      grid: { color: "#27272a" },
      ticks: { color: "#a1a1aa" },
    },
  },
};

// Nutrition Chart Data
const nutritionChartData = computed<ChartData<"bar" | "line">>(() => {
  const nutrientKey = selectedNutrient.value as string;
  // nutrientOptions value matches the API keys: carbs, protein, fat, calories

  const labels = rawDietStats.value.map((d) => d.dayOfWeekKr);
  const data = rawDietStats.value.map((d) => d[nutrientKey]);

  return {
    labels: labels,
    datasets: [
      {
        type: "bar" as const,
        label: nutrientOptions.find((o) => o.value === nutrientKey)?.label || nutrientKey,
        backgroundColor: "#10b981",
        data: data,
        borderRadius: 4,
        order: 2,
      },
    ],
  } as any;
});

// Exercise Chart Data
const exerciseChartData = computed<ChartData<"bar" | "line">>(() => {
  const statKey = selectedExerciseStat.value as string;
  // exerciseStatOptions value matches API keys: durationMinutes, calories

  const labels = rawExerciseStats.value.map((d) => d.dayOfWeekKr);
  const data = rawExerciseStats.value.map((d) => d[statKey]);

  return {
    labels: labels,
    datasets: [
      {
        type: "bar" as const,
        label: exerciseStatOptions.find((o) => o.value === statKey)?.label || statKey,
        backgroundColor: "#f97316",
        data: data,
        borderRadius: 4,
        order: 2,
      },
    ],
  } as any;
});
</script>

<template>
  <div class="space-y-6">
    <!-- 상단 - 주간 선택 (제목 제거 및 우측 정렬) -->
    <div class="flex justify-end">
      <Select v-model="selectedWeek" :options="weekOptions" class="w-[280px] bg-zinc-900 border-zinc-800 text-white" />
    </div>

    <!-- 로딩 상태 표시 -->
    <div v-if="isLoading" class="text-center py-20 text-zinc-500">데이터를 불러오는 중입니다...</div>

    <div v-else class="space-y-6">
      <!-- AI 분석 카드 그리드 (영양 + 운동) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 0. 주간 영양 AI 분석 -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 h-full flex flex-col">
          <div class="flex items-center justify-between">
            <h3 class="text-xl text-white flex items-center gap-2">✨ 영양 분석</h3>
            <span class="text-xs text-zinc-500" v-if="nutritionReview && nutritionReview.generatedAt">
              {{ new Date(nutritionReview.generatedAt).toLocaleDateString() }}
            </span>
          </div>

          <!-- Case 1: Data Available -->
          <template v-if="nutritionReview">
            <!-- 상태 뱃지 그리드 -->
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="key in ['calorieStatus', 'carbohydrateStatus', 'proteinStatus', 'fatStatus']"
                :key="key"
                class="bg-zinc-950 rounded-lg p-2 md:p-3 border border-zinc-800 flex items-center justify-between"
              >
                <span class="text-zinc-400 text-xs md:text-sm">{{ getStatusLabel(key) }}</span>
                <span
                  class="text-xs px-2 py-1 rounded border font-medium"
                  :class="getStatusBadge(nutritionReview[key]).class"
                >
                  {{ getStatusBadge(nutritionReview[key]).text }}
                </span>
              </div>
            </div>

            <!-- 요약 텍스트 -->
            <div class="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50 flex-1">
              <p class="text-zinc-300 leading-relaxed whitespace-pre-line text-sm">
                {{ nutritionReview.summaryText }}
              </p>
            </div>
          </template>

          <!-- Case 2: Loading / Analyzing -->
          <template v-else-if="isNutritionReviewLoading">
            <div class="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
              <div class="text-center space-y-1">
                <p class="text-zinc-300 font-medium">AI가 영양 섭취를 분석하고 있어요</p>
                <p class="text-zinc-500 text-sm">잠시만 기다려주세요...</p>
              </div>
            </div>
          </template>

          <!-- Case 3: No Data or Analysis Failed -->
          <template v-else>
             <div class="flex-1 flex flex-col items-center justify-center space-y-2 py-8 text-zinc-500">
               <p>분석할 데이터가 없거나 분석에 실패했습니다.</p>
             </div>
          </template>
        </div>

        <!-- 0.5 주간 운동 AI 분석 (New) -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 h-full flex flex-col">
          <div class="flex items-center justify-between">
            <h3 class="text-xl text-white flex items-center gap-2">💪 운동 분석</h3>
            <span class="text-xs text-zinc-500" v-if="exerciseReview && exerciseReview.generatedAt">
              {{ new Date(exerciseReview.generatedAt).toLocaleDateString() }}
            </span>
          </div>

          <!-- Case 1: Data Available -->
          <template v-if="exerciseReview">
            <!-- 상태 뱃지 -->
            <div class="bg-zinc-950 rounded-lg p-3 border border-zinc-800 flex items-center justify-between">
              <span class="text-zinc-400 text-sm">운동량</span>
              <span
                class="text-xs px-2 py-1 rounded border font-medium"
                :class="getExerciseStatusBadge(exerciseReview.volumeStatus).class"
              >
                {{ getExerciseStatusBadge(exerciseReview.volumeStatus).text }}
              </span>
            </div>

            <!-- 요약 텍스트 & 추천 -->
            <div class="space-y-3 flex-1">
              <div class="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50">
                <p class="text-zinc-300 leading-relaxed whitespace-pre-line text-sm">
                  {{ exerciseReview.summaryText }}
                </p>
              </div>
              <div
                v-if="exerciseReview.recommendation"
                class="bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-4"
              >
                <p class="text-emerald-400 text-xs font-bold mb-1">RECOMMENDATION</p>
                <p class="text-zinc-300 leading-relaxed text-sm">
                  {{ exerciseReview.recommendation }}
                </p>
              </div>
            </div>
          </template>

          <!-- Case 2: Loading / Analyzing -->
          <template v-else-if="isExerciseReviewLoading">
            <div class="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
              <div class="text-center space-y-1">
                <p class="text-zinc-300 font-medium">AI가 운동 기록을 분석하고 있어요</p>
                <p class="text-zinc-500 text-sm">잠시만 기다려주세요...</p>
              </div>
            </div>
          </template>

          <!-- Case 3: No Data or Analysis Failed -->
          <template v-else>
             <div class="flex-1 flex flex-col items-center justify-center space-y-2 py-8 text-zinc-500">
               <p>분석할 데이터가 없거나 분석에 실패했습니다.</p>
             </div>
          </template>
        </div>
      </div>

      <!-- 1. 주간 영양소 섭취 추이 (가로 전체) -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-xl text-white">주간 영양소 섭취 추이</h3>
          <Select
            v-model="selectedNutrient"
            :options="nutrientOptions"
            class="w-[140px] h-9 text-sm bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <!-- 그래프 -->
        <div class="w-full h-[400px]">
          <div v-if="!hasDietData" class="w-full h-full flex items-center justify-center text-zinc-500">
            데이터가 없습니다.
          </div>
          <Bar v-else :data="nutritionChartData" :options="commonOptions" />
        </div>
      </div>

      <!-- 2. 주간 운동 추이 (그 밑에) -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-xl text-white">주간 운동 추이</h3>
          <Select
            v-model="selectedExerciseStat"
            :options="exerciseStatOptions"
            class="w-[140px] h-9 text-sm bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <!-- 그래프 -->
        <div class="w-full h-[400px]">
          <div v-if="!hasExerciseData" class="w-full h-full flex items-center justify-center text-zinc-500">
            데이터가 없습니다.
          </div>
          <Bar v-else :data="exerciseChartData" :options="commonOptions" />
        </div>
      </div>
    </div>
  </div>
</template>
