<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Calendar } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import ImageWithFallback from "@/components/common/ImageWithFallback.vue";
import challengeApi, { type ChallengeSummary } from "@/api/challenge";

const router = useRouter();
const activeTab = ref<"recruiting" | "joined">("recruiting"); // Renamed 'all' to 'recruiting'
const challenges = ref<ChallengeSummary[]>([]);
const isLoading = ref(false);

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
  today.getDate()
).padStart(2, "0")}`;

const fetchChallenges = async () => {
  isLoading.value = true;
  try {
    const currentMonth = todayStr.substring(0, 7); // YYYY-MM

    // Calculate next month
    const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

    const [resCurrent, resNext] = await Promise.all([
      challengeApi.getChallenges(currentMonth),
      challengeApi.getChallenges(nextMonth),
    ]);

    const merged = [...resCurrent.data.challenges, ...resNext.data.challenges];

    // Remove duplicates if any (based on challengeId)
    const unique = merged.filter((c, index, self) => index === self.findIndex((t) => t.challengeId === c.challengeId));

    console.log("Merged API Response:", unique);
    challenges.value = unique;
  } catch (error) {
    console.error("Failed to fetch challenges:", error);
    alert("챌린지 목록을 불러오는데 실패했습니다.");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchChallenges();
});

const filteredChallenges = computed(() => {
  if (activeTab.value === "joined") {
    // Exclude 'PRE_REGISTRATION' (Joined but not started yet)
    return challenges.value.filter((c) => c.isJoined && c.startDate <= todayStr);
  } else if (activeTab.value === "recruiting") {
    // Show challenges that are currently recruiting OR upcoming (not ended yet)
    return challenges.value.filter((c) => {
      return c.recruitEndDate >= todayStr;
    });
  }
  return challenges.value;
});

const handleJoinToggle = async (challengeId: number, isJoined?: boolean) => {
  if (isJoined) {
    // If already joined, maybe confirm leave or just go to detail
    // User requested "Join/Leave" endpoints, let's keep leave here for convenience if desired,
    // BUT typically leaving is a significant action detailed in detail page.
    // Let's just navigate to detail for both for consistency,
    // OR keep leave here but "Join" MUST go to detail.
    // Let's redirect to detail for better UX and difficulty selection.
    router.push(`/challenge-detail/${challengeId}`);
  } else {
    // Must go to detail to select difficulty
    router.push(`/challenge-detail/${challengeId}`);
  }
};

const navigateToDetail = (challengeId: number) => {
  router.push(`/challenge-detail/${challengeId}`);
};
</script>

<template>
  <div class="space-y-6">
    <!-- 설명 -->
    <p class="text-zinc-400">매달 1~3개의 챌린지가 제공되며, 모든 사용자가 같은 챌린지에 도전할 수 있어요.</p>

    <!-- 탭 -->
    <div class="flex gap-2 border-b border-zinc-800 pb-1">
      <button
        v-for="tab in ['recruiting', 'joined']"
        :key="tab"
        @click="activeTab = tab as any"
        class="px-4 py-2 text-sm font-medium transition-colors relative"
        :class="activeTab === tab ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'"
      >
        {{ tab === "recruiting" ? "모집 중" : "참여 중" }}
        <div v-if="activeTab === tab" class="absolute bottom-[-5px] left-0 w-full h-0.5 bg-emerald-500"></div>
      </button>
    </div>

    <!-- 챌린지 그리드 -->
    <div v-if="isLoading" class="text-center py-20 text-zinc-500">로딩 중...</div>

    <div v-else-if="filteredChallenges.length === 0" class="text-center py-20 text-zinc-500">
      {{ activeTab === "recruiting" ? "현재 모집 중인 챌린지가 없습니다." : "참여 중인 챌린지가 없습니다." }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="challenge in filteredChallenges"
        :key="challenge.challengeId"
        class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
      >
        <!-- 썸네일 -->
        <div class="relative aspect-video w-full overflow-hidden bg-zinc-800">
          <ImageWithFallback :src="challenge.imageUrl" :alt="challenge.title" class="w-full h-full object-cover" />
        </div>

        <!-- 내용 -->
        <div class="p-5 space-y-4">
          <!-- 제목 -->
          <h3 class="text-xl text-white font-semibold">
            {{ challenge.title }}
          </h3>

          <!-- 설명 -->
          <p class="text-sm text-zinc-400 line-clamp-2">
            {{ challenge.shortDescription }}
          </p>

          <!-- 기간 -->
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-zinc-500 text-sm">
              <Calendar class="w-4 h-4" />
              <span>진행: {{ challenge.startDate }} ~ {{ challenge.endDate }}</span>
            </div>
            <div class="flex items-center gap-2 text-zinc-500 text-sm">
              <Calendar class="w-4 h-4 text-emerald-500" />
              <span class="text-emerald-500"
                >모집: {{ challenge.recruitStartDate }} ~ {{ challenge.recruitEndDate }}</span
              >
            </div>
          </div>

          <!-- 참여자 수 -->
          <div class="text-sm text-zinc-400">참여자 {{ challenge.participantsCount }}명</div>

          <!-- Progress Bar for Joined Challenges (Optional based on design, but data is available) -->
          <div
            v-if="challenge.isJoined && challenge.progressPercentage !== null"
            class="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1"
          >
            <div class="h-full bg-emerald-500" :style="{ width: `${challenge.progressPercentage}%` }"></div>
          </div>

          <!-- 버튼 -->
          <div class="flex gap-2 pt-2">
            <Button
              @click="navigateToDetail(challenge.challengeId)"
              variant="outline"
              class="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              상세보기
            </Button>
            <!-- Only show Join button if recruiting or not joined -->
            <Button
              v-if="!challenge.isJoined"
              @click="handleJoinToggle(challenge.challengeId, challenge.isJoined)"
              class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              참여하기
            </Button>
            <Button
              v-else
              @click="handleJoinToggle(challenge.challengeId, challenge.isJoined)"
              variant="outline"
              class="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            >
              참여 중
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
