<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import Textarea from "@/components/ui/Textarea.vue";

const router = useRouter();
const today = new Date();
const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(
  today.getDate()
).padStart(2, "0")}`;

// Form State
const title = ref("");
const startDate = ref("");
const endDate = ref("");
const shortDescription = ref("");
const goal = ref("");
const detailDescription = ref("");
const rules = ref<string[]>([""]);
const thumbnailPreview = ref<string>("");

const handleAddRule = () => {
  rules.value.push("");
};

const handleRemoveRule = (index: number) => {
  if (rules.value.length > 1) {
    rules.value.splice(index, 1);
  }
};

const handleThumbnailUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      thumbnailPreview.value = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleSubmit = () => {
  console.log("챌린지 생성:", {
    title: title.value,
    startDate: startDate.value,
    endDate: endDate.value,
    shortDescription: shortDescription.value,
    goal: goal.value,
    detailDescription: detailDescription.value,
    rules: rules.value.filter((r) => r.trim() !== ""),
  });
  // Implement creation logic here
  router.push("/challenge-list");
};

const goBack = () => {
  router.push("/challenge-list");
};
</script>

<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" @click="goBack" class="text-zinc-400 hover:text-white p-2">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="text-2xl text-white font-bold">챌린지 만들기</h1>
      </div>
      <div class="text-zinc-400 hidden sm:block">
        {{ formattedDate }}
      </div>
    </div>

    <div class="max-w-4xl mx-auto">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 기본 정보 카드 -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
          <h2 class="text-2xl text-white font-semibold">기본 정보</h2>

          <!-- 썸네일 업로드 -->
          <div class="space-y-3">
            <Label class="text-zinc-300">썸네일 이미지</Label>
            <div class="space-y-4">
              <div v-if="thumbnailPreview" class="relative aspect-video w-full max-w-md rounded-lg overflow-hidden">
                <img :src="thumbnailPreview" alt="Thumbnail preview" class="w-full h-full object-cover" />
              </div>
              <div>
                <input type="file" id="thumbnail" accept="image/*" @change="handleThumbnailUpload" class="hidden" />
                <label for="thumbnail">
                  <Button
                    type="button"
                    variant="outline"
                    class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 cursor-pointer"
                    @click="() => document.getElementById('thumbnail')?.click()"
                  >
                    <Upload class="w-4 h-4 mr-2" />
                    이미지 업로드
                  </Button>
                </label>
              </div>
            </div>
          </div>

          <!-- 제목 -->
          <div class="space-y-3">
            <Label for="title" class="text-zinc-300">챌린지 제목 *</Label>
            <Input
              id="title"
              v-model="title"
              placeholder="예: 2주 저녁 샐러드 챌린지"
              class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              required
            />
          </div>

          <!-- 기간 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <Label for="startDate" class="text-zinc-300">시작일 *</Label>
              <Input
                id="startDate"
                type="date"
                v-model="startDate"
                class="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            <div class="space-y-3">
              <Label for="endDate" class="text-zinc-300">종료일 *</Label>
              <Input
                id="endDate"
                type="date"
                v-model="endDate"
                class="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
          </div>

          <!-- 한 줄 설명 -->
          <div class="space-y-3">
            <Label for="shortDescription" class="text-zinc-300">한 줄 설명 *</Label>
            <Input
              id="shortDescription"
              v-model="shortDescription"
              placeholder="챌린지를 간단히 설명해주세요"
              class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              required
            />
          </div>

          <!-- 목표 -->
          <div class="space-y-3">
            <Label for="goal" class="text-zinc-300">목표 *</Label>
            <Input
              id="goal"
              v-model="goal"
              placeholder="예: 하루 한 번 저녁 식단 기록"
              class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              required
            />
          </div>
        </div>

        <!-- 상세 정보 카드 -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
          <h2 class="text-2xl text-white font-semibold">상세 정보</h2>

          <!-- 상세 설명 -->
          <div class="space-y-3">
            <Label for="detailDescription" class="text-zinc-300">상세 설명 *</Label>
            <Textarea
              id="detailDescription"
              v-model="detailDescription"
              placeholder="챌린지에 대한 자세한 설명을 작성해주세요"
              class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[150px]"
              required
            />
          </div>

          <!-- 규칙 및 성공 조건 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label class="text-zinc-300">규칙 및 성공 조건 *</Label>
              <Button
                type="button"
                @click="handleAddRule"
                variant="outline"
                size="sm"
                class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Plus class="w-4 h-4 mr-1" />
                규칙 추가
              </Button>
            </div>
            <div class="space-y-3">
              <div v-for="(rule, index) in rules" :key="index" class="flex gap-2">
                <Input
                  v-model="rules[index]"
                  :placeholder="`규칙 ${index + 1}`"
                  class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  required
                />
                <Button
                  v-if="rules.length > 1"
                  type="button"
                  @click="handleRemoveRule(index)"
                  variant="outline"
                  size="icon"
                  class="bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white flex-shrink-0"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 제출 버튼 -->
        <div class="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            @click="goBack"
            class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            취소
          </Button>
          <Button type="submit" class="bg-emerald-500 hover:bg-emerald-600 text-white"> 챌린지 만들기 </Button>
        </div>
      </form>
    </div>
  </div>
</template>
