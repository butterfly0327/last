<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Heart, MessageCircle, ImagePlus, Send, X } from "lucide-vue-next";
import Avatar from "@/components/ui/Avatar.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Dialog from "@/components/ui/Dialog.vue";
import Label from "@/components/ui/Label.vue";

import communityApi, { type PostSummary } from "@/api/community";
import imageApi from "@/api/image";

const router = useRouter();

// Feed State
const posts = ref<PostSummary[]>([]);
const isLoading = ref(false);

// Create Post State
const isWriteDialogOpen = ref(false);
const newPostTitle = ref("");
const newPostContent = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const selectedImages = ref<{ file: File; preview: string }[]>([]);

// --- Search / Fetch ---
const fetchPosts = async () => {
  isLoading.value = true;
  try {
    const response = await communityApi.getPosts({ page: 0, size: 20 });
    console.log("Posts Data:", response.data);
    posts.value = response.data.posts;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchPosts();
});

// --- Navigation ---
const goToDetail = (postId: number) => {
  router.push({ name: "community-detail", params: { id: postId } });
};

const goToProfile = (userId: number) => {
  router.push({ name: "user-profile", params: { id: userId } });
};

// --- Create Post Actions ---
const openWriteDialog = () => {
  isWriteDialogOpen.value = true;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          selectedImages.value.push({
            file,
            preview: e.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }
};

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1);
};

const handleSubmitPost = async () => {
  if (!newPostContent.value.trim()) return;

  try {
    // 1. Upload images
    const imageUrls: string[] = [];
    if (selectedImages.value.length > 0) {
      const uploadPromises = selectedImages.value.map((img) => imageApi.uploadImage(img.file, "POST"));
      const results = await Promise.all(uploadPromises);
      imageUrls.push(...results);
    }

    // 2. Create Post
    await communityApi.createPost({
      title: newPostTitle.value,
      content: newPostContent.value,
      images: imageUrls,
    });

    // Reset and reload
    newPostContent.value = "";
    newPostTitle.value = "";
    selectedImages.value = [];
    if (fileInput.value) fileInput.value.value = "";
    isWriteDialogOpen.value = false;

    alert("게시글이 작성되었습니다.");
    fetchPosts();
  } catch (error: any) {
    console.error("Failed to create post:", error);
    alert("게시글 작성에 실패했습니다.");
  }
};

// Utilities
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 1000 * 60) {
    return "방금 전";
  }

  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  if (hours < 24) {
    return `${hours}시간 전`;
  }

  if (days < 7) {
    return `${days}일 전`;
  }

  return date.toLocaleDateString();
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Write Button -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl text-white">전체 피드</h2>
      <Button class="bg-emerald-500 hover:bg-emerald-600 text-white" @click="openWriteDialog">
        <Send class="w-4 h-4 mr-2" />
        글 작성하기
      </Button>
    </div>

    <!-- Feed List -->
    <div v-if="isLoading" class="text-center text-zinc-500 py-10">로딩 중...</div>

    <div v-else class="space-y-4">
      <div
        v-for="post in posts"
        :key="post.postId"
        class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700 transition flex min-h-40"
        @click="goToDetail(post.postId)"
      >
        <!-- Left Content Section -->
        <div class="flex-1 p-5 flex flex-col justify-center gap-3 min-w-0">
          <!-- Top Section: Author + Content -->
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div @click.stop="goToProfile(post.authorId)" class="cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar :src="post.authorProfileImageUrl" :fallback="post.authorUsername?.[0]" class="w-8 h-8" />
              </div>
              <div @click.stop="goToProfile(post.authorId)" class="cursor-pointer hover:underline">
                <div class="text-white text-sm font-medium">{{ post.authorUsername }}</div>
                <div class="text-[10px] text-zinc-400">{{ formatTime(post.createdAt) }}</div>
              </div>
            </div>

            <h3 class="text-lg font-semibold text-zinc-100 mb-1 line-clamp-1">{{ post.title }}</h3>
            <p class="text-zinc-400 text-sm line-clamp-2 leading-relaxed break-words">
              {{ post.contentPreview || post.content }}
            </p>
          </div>

          <!-- Bottom Section: Stats -->
          <div class="flex items-center gap-4 text-zinc-400 text-sm">
            <span class="flex items-center gap-1"> <Heart class="w-4 h-4" /> {{ post.likeCount }} </span>
            <span class="flex items-center gap-1"> <MessageCircle class="w-4 h-4" /> {{ post.commentCount }} </span>
          </div>
        </div>

        <!-- Right Image Section (With slight padding) -->
        <div v-if="post.thumbnailUrl || (post.images && post.images.length > 0)" class="w-40 flex-shrink-0 p-2">
          <img
            :src="post.thumbnailUrl || post.images?.[0]"
            class="w-full h-full object-cover rounded-lg bg-zinc-800"
            loading="lazy"
          />
        </div>
      </div>
    </div>

    <!-- Write Post Dialog -->
    <Dialog v-model:open="isWriteDialogOpen" title="새 글 작성">
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label class="text-zinc-300">제목</Label>
          <Input
            v-model="newPostTitle"
            placeholder="제목을 입력하세요"
            class="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div class="space-y-2">
          <Label class="text-zinc-300">내용</Label>
          <Textarea
            v-model="newPostContent"
            placeholder="내용을 입력하세요..."
            :rows="6"
            class="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <!-- Image Selection -->
        <div class="space-y-2">
          <Label class="text-zinc-300">이미지 (선택)</Label>
          <div class="grid grid-cols-4 gap-2 mb-2" v-if="selectedImages.length > 0">
            <div
              v-for="(img, idx) in selectedImages"
              :key="idx"
              class="relative aspect-square rounded-lg overflow-hidden bg-zinc-800"
            >
              <img :src="img.preview" class="w-full h-full object-cover" />
              <button
                @click="removeImage(idx)"
                class="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-black/70"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" multiple @change="handleFileChange" />
          <Button
            variant="outline"
            class="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            @click="triggerFileInput"
          >
            <ImagePlus class="w-4 h-4 mr-2" />
            이미지 업로드
          </Button>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-4">
        <Button
          variant="outline"
          @click="isWriteDialogOpen = false"
          class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        >
          취소
        </Button>
        <Button @click="handleSubmitPost" class="bg-emerald-500 hover:bg-emerald-600 text-white"> 게시하기 </Button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
