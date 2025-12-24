<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Calendar, ArrowLeft } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import challengeApi, { type ChallengeDetailResponse } from "@/api/challenge";

const route = useRoute();
const router = useRouter();
const challengeId = Number(route.params.id);

const challenge = ref<ChallengeDetailResponse | null>(null);
const isLoading = ref(true);
const selectedDifficulty = ref<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

// Determine status based on dates
// isPreStart: today < startDate
// isRecruiting: today >= recruitStartDate && today <= recruitEndDate
// isStarted: today >= startDate && today <= endDate

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const res = await challengeApi.getChallengeDetail(challengeId);
        challenge.value = res.data;
        if (challenge.value.selectedDifficulty) {
            // If already joined, set difficulty
            selectedDifficulty.value = challenge.value.selectedDifficulty as any;
        } else {
            // Default to Intermediate if exists, else first available
            if (challenge.value.difficultyOptions?.some(d => d.difficultyCode === 'INTERMEDIATE')) {
                selectedDifficulty.value = "INTERMEDIATE";
            } else if (challenge.value.difficultyOptions && challenge.value.difficultyOptions.length > 0) {
                selectedDifficulty.value = challenge.value.difficultyOptions[0].difficultyCode;
            }
        }
    } catch (error: any) {
        console.error("Failed to fetch challenge detail:", error);
        if (error.response?.status === 404) {
            alert("존재하지 않는 챌린지입니다.");
            router.replace("/challenge-list");
        } else {
            alert("챌린지 정보를 불러오는데 실패했습니다.");
        }
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchDetail();
});



const handleJoin = async () => {
    if (!confirm(`'${getDifficultyLabel(selectedDifficulty.value)}' 난이도로 챌린지에 참여하시겠습니까?`)) return;
    
    try {
        await challengeApi.joinChallenge(challengeId, selectedDifficulty.value); 
        alert("챌린지에 참여했습니다!");
        await fetchDetail();
    } catch (error: any) {
        if (error.response?.status === 409) {
            alert("이미 참여 중인 챌린지입니다.");
        } else {
            alert("참여에 실패했습니다.");
        }
    }
};

const handleLeave = async () => {
    const isStarted = todayStr >= (challenge.value?.startDate || "");
    const message = isStarted 
        ? "정말로 챌린지를 중도 포기하시겠습니까?\n중도 포기 시 재참여가 불가능할 수 있습니다." 
        : "사전 신청을 취소하시겠습니까?";
        
    if (!confirm(message)) return;
    
    try {
        await challengeApi.leaveChallenge(challengeId);
        alert(isStarted ? "챌린지를 포기했습니다." : "신청이 취소되었습니다.");
        // If getting challenge detail again, isJoined will be false.
        // User remains on page? or redirect? 
        // Typically refresh detail.
        await fetchDetail();
    } catch (error: any) {
        if (error.response?.status === 409) {
            alert("이미 나간 챌린지입니다.");
        } else {
            alert("처리 중 오류가 발생했습니다.");
        }
    }
};

const goBack = () => {
  router.push("/challenge-list");
};

const getDifficultyLabel = (code: string) => {
    const map: Record<string, string> = {
        'BEGINNER': '초급',
        'INTERMEDIATE': '중급',
        'ADVANCED': '고급'
    };
    return map[code] || code;
};

</script>

<template>
  <div v-if="isLoading" class="flex justify-center py-20">
      <div class="text-zinc-400">로딩 중...</div>
  </div>

  <div v-else-if="challenge" class="space-y-6">
    <!-- 헤더 -->
    <div class="max-w-5xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" @click="goBack" class="text-zinc-400 hover:text-white p-2">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="text-2xl text-white font-bold">챌린지 상세</h1>
      </div>
    </div>

    <div class="max-w-5xl mx-auto space-y-6">
      <!-- 상단 기본 정보 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
        <!-- 라벨 -->
        <div>
          <span
            class="inline-block text-sm px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400"
          >
            {{ challenge.type === 'PUBLIC' ? '공통 챌린지' : '챌린지' }}
          </span>
        </div>

        <!-- 제목 -->
        <h2 class="text-3xl text-white font-bold">{{ challenge.title }}</h2>

        <!-- 부제 -->
        <p class="text-zinc-400">{{ challenge.shortDescription }}</p>

        <!-- 기간 -->
        <div class="space-y-2">
             <div class="flex items-center gap-2 text-zinc-300 text-sm">
                <Calendar class="w-5 h-5" />
                <span>진행 기간: {{ challenge.startDate }} ~ {{ challenge.endDate }}</span>
            </div>
             <div class="flex items-center gap-2 text-zinc-300 text-sm">
                <Calendar class="w-5 h-5 text-emerald-500" />
                <span class="text-emerald-500">모집 기간: {{ challenge.recruitStartDate }} ~ {{ challenge.recruitEndDate }}</span>
            </div>
        </div>

        <!-- 난이도 선택 영역 -->
        <div v-if="challenge.difficultyOptions && challenge.difficultyOptions.length > 0" class="space-y-4 pt-4 border-t border-zinc-800">
          <h3 class="text-white font-medium">난이도 선택</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              v-for="diff in challenge.difficultyOptions"
              :key="diff.difficultyCode"
              @click="selectedDifficulty = diff.difficultyCode"
              :disabled="challenge.isJoined"
              class="p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden group"
              :class="[
                selectedDifficulty === diff.difficultyCode
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600',
                challenge.isJoined ? 'cursor-not-allowed opacity-80' : 'cursor-pointer',
              ]"
            >
              <div class="space-y-2 relative z-10">
                <div class="flex justify-between items-start">
                    <div
                    class="text-lg font-semibold"
                    :class="selectedDifficulty === diff.difficultyCode ? 'text-emerald-400' : 'text-white'"
                    >
                    {{ getDifficultyLabel(diff.difficultyCode) }}
                    </div>
                     <!-- Reward Icon for visual flair -->
                    <div class="text-2xl">{{ diff.rewardTitleIconEmoji }}</div>
                </div>
                
                <div class="text-sm text-zinc-300">
                   월 {{ diff.requiredSuccessDays }}일 성공
                   <span v-if="diff.dailyTargetValue"> (일일 목표 {{ diff.dailyTargetValue }})</span>
                </div>
                <!-- Reward Description as hint -->
                <div class="text-xs text-zinc-500 pt-1 line-clamp-2">
                    보상: {{ diff.rewardTitleName }}
                </div>
              </div>
            </button>
          </div>
          <p v-if="challenge.isJoined" class="text-xs text-zinc-500">
            * 챌린지 참여 후에는 난이도를 변경할 수 없습니다.
          </p>
        </div>

         <!-- 유의 사항 / 규칙 설명 -->
        <div class="space-y-3 pt-4 border-t border-zinc-800">
          <h3 class="text-xl text-white font-semibold">규칙 및 설명</h3>
          <p class="text-zinc-400 whitespace-pre-line leading-relaxed">
            {{ challenge.ruleDescription }}
          </p>
        </div>
        
        <!-- 목표 요약 -->
         <div class="space-y-3">
          <h3 class="text-xl text-white font-semibold">목표</h3>
          <p class="text-zinc-400">
            {{ challenge.goalSummary }}
          </p>
        </div>


        <!-- 버튼 Logic -->
        <div class="pt-4">
            <!-- Case 1: Pre-start + Joined -->
            <div v-if="challenge.isJoined && todayStr < challenge.startDate">
                 <div class="flex gap-2">
                     <Button disabled class="flex-1 bg-zinc-700 text-zinc-300 py-6 text-lg cursor-not-allowed">
                        사전신청 완료
                     </Button>
                     <Button @click="handleLeave" variant="outline" class="w-1/3 border-red-500 text-red-500 hover:bg-red-500/10 py-6 text-lg">
                        신청 취소
                     </Button>
                 </div>
                 <p class="text-center text-zinc-500 text-sm mt-2">챌린지 시작 전까지 취소할 수 있습니다.</p>
            </div>

            <!-- Case 2: Pre-start + Not Joined + Recruiting -->
            <div v-else-if="!challenge.isJoined && todayStr >= challenge.recruitStartDate && todayStr <= challenge.recruitEndDate">
                 <Button @click="handleJoin" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg">
                    참여하기
                </Button>
            </div>
             <!-- Case 2-1: Recruiting Ended + Not Joined -->
             <div v-else-if="!challenge.isJoined && todayStr > challenge.recruitEndDate">
                 <Button disabled class="w-full bg-zinc-800 text-zinc-500 py-6 text-lg cursor-not-allowed">
                    모집 마감
                </Button>
            </div>
             <!-- Case 2-2: Before Recruiting + Not Joined -->
             <div v-else-if="!challenge.isJoined && todayStr < challenge.recruitStartDate">
                 <Button disabled class="w-full bg-zinc-800 text-zinc-500 py-6 text-lg cursor-not-allowed">
                    모집 예정
                </Button>
            </div>

            <!-- Case 3: Started + Joined -->
            <div v-else-if="challenge.isJoined && todayStr >= challenge.startDate">
                <!-- Participating UI: Progress -->
                <div class="bg-zinc-800/50 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-white font-medium">내 진행률</span>
                        <div class="text-right">
                             <span class="text-emerald-400 font-bold block">{{ challenge.progressPercentage || 0 }}%</span>
                             <span class="text-xs text-zinc-500">
                                 ({{ challenge.successDays || 0 }} / {{ challenge.requiredSuccessDays || '?' }}일 성공)
                             </span>
                        </div>
                    </div>
                     <div class="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-emerald-500 transition-all duration-300"
                            :style="{ width: `${challenge.progressPercentage || 0}%` }"
                        ></div>
                    </div>
                </div>
                 <div class="flex flex-col gap-2">
                    <Button disabled class="w-full border-zinc-700 text-zinc-400 py-6 text-lg bg-zinc-800">
                        참여 중
                    </Button>
                     <button @click="handleLeave" class="text-xs text-zinc-500 underline hover:text-zinc-300 self-center">
                        챌린지 포기하기
                    </button>
                </div>
            </div>
        </div>
      </div>
      
       <!-- 하단 정보: 참여자 수 등 -->
       <div class="text-center text-zinc-500">
           현재 {{ challenge.participantsCount }}명이 함께하고 있습니다.
       </div>

    </div>
  </div>
</template>
