<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Heart, MessageCircle, ArrowLeft, Send, Trash2, Pencil, X, ImagePlus } from "lucide-vue-next";
import Avatar from "@/components/ui/Avatar.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Label from "@/components/ui/Label.vue";

import communityApi, { type PostDetailResponse, type CommentResponse } from "@/api/community";
import imageApi from "@/api/image";

const route = useRoute();
const router = useRouter();
const postId = Number(route.params.id);

const goToProfile = (userId: number) => {
  router.push({ name: "user-profile", params: { id: userId } });
};

// State
const post = ref<PostDetailResponse | null>(null);
const comments = ref<CommentResponse[]>([]);
const newCommentContent = ref("");
const isLoading = ref(false);

// Edit State
const isEditMode = ref(false);
const editTitle = ref("");
const editContent = ref("");
const editImages = ref<{ file?: File; preview: string; isExisting?: boolean }[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// --- Fetch Data ---
const fetchPostDetail = async () => {
  if (!postId) return;
  isLoading.value = true;
  try {
    const [postRes, commentRes] = await Promise.all([
      communityApi.getPostDetail(postId),
      communityApi.getCommentsByPost(postId),
    ]);
    post.value = postRes.data;

    // Comments Structure Handling
    // Spec: { postId, totalCount, comments: [] }
    if (commentRes.data && Array.isArray(commentRes.data.comments)) {
      comments.value = commentRes.data.comments;
    } else {
      comments.value = [];
    }
  } catch (error: any) {
    console.error("Failed to fetch detail:", error);

    if (error.response?.status === 404) {
      // Determine if it was the post or comments that failed (though usually handled together)
      alert("게시글을 찾을 수 없습니다.");
      router.back();
    } else {
      alert("게시글 정보를 불러오는데 실패했습니다.");
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchPostDetail();
});

// --- Edit Actions ---
const startEdit = () => {
  if (!post.value) return;
  isEditMode.value = true;
  editTitle.value = post.value.title;
  editContent.value = post.value.content;

  editImages.value = post.value.images.map((url) => ({
    preview: url,
    isExisting: true,
  }));
};

const cancelEdit = () => {
  isEditMode.value = false;
  editImages.value = [];
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
          editImages.value.push({
            file,
            preview: e.target.result as string,
            isExisting: false,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }
};

const removeImage = (index: number) => {
  editImages.value.splice(index, 1);
};

const handleUpdate = async () => {
  if (!editTitle.value.trim() || !editContent.value.trim()) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  try {
    // 1. Separate & Upload
    const existingImages = editImages.value
      .filter((img) => img.isExisting)
      .map((img) => {
        // Extract object key from full URL
        // Assuming URL format is https://domain.com/KEY
        try {
          const urlObj = new URL(img.preview);
          return urlObj.pathname.substring(1); // Remove leading slash
        } catch (e) {
          // Fallback if not a valid URL or other issue, though it should be a full URL from backend
          console.warn("Failed to extract key from URL:", img.preview);
          return img.preview;
        }
      });

    const newFiles = editImages.value.filter((img) => !img.isExisting && img.file).map((img) => img.file!);

    const newImageKeys: string[] = [];
    if (newFiles.length > 0) {
      const uploadPromises = newFiles.map((file) => imageApi.uploadImage(file, "POST"));
      const results = await Promise.all(uploadPromises);
      newImageKeys.push(...results);
    }

    const finalImages = [...existingImages, ...newImageKeys];

    // 2. Update API
    const res = await communityApi.updatePost(postId, {
      title: editTitle.value,
      content: editContent.value,
      images: finalImages,
    });

    // 3. Update Local State
    if (post.value) {
      post.value = { ...post.value, ...res.data };
    }

    alert("게시글이 수정되었습니다.");
    isEditMode.value = false;
  } catch (error) {
    console.error("Failed to update post:", error);
    alert("게시글 수정에 실패했습니다.");
  }
};

// --- View Actions ---
const deletePost = async () => {
  if (!confirm("정말로 삭제하시겠습니까?")) return;
  try {
    await communityApi.deletePost(postId);
    alert("게시글이 삭제되었습니다.");
    router.replace("/community");
  } catch (error: any) {
    if (error.response?.status === 403) alert("권한이 없습니다.");
    else alert("삭제 실패했습니다.");
  }
};

const toggleLike = async () => {
  if (!post.value) return;

  try {
    if (post.value.isLikedByMe) {
      // Unlike
      const res = await communityApi.unlikePost(postId);
      post.value.isLikedByMe = false;

      if (res.data && typeof res.data.likeCount === "number") {
        post.value.likeCount = res.data.likeCount;
      } else {
        post.value.likeCount--;
      }
    } else {
      // Like
      const res = await communityApi.likePost(postId);
      post.value.isLikedByMe = true;

      if (res.data && typeof res.data.likeCount === "number") {
        post.value.likeCount = res.data.likeCount;
      } else {
        post.value.likeCount++;
      }
    }
  } catch (error: any) {
    console.error("Failed to toggle like:", error);
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        alert("로그인이 필요합니다.");
      } else if (status === 404) {
        if (data?.code === "LIKE_NOT_FOUND") {
          alert("해당 게시글에 대해 눌러둔 좋아요가 없습니다.");
          // Sync state
          if (post.value) post.value.isLikedByMe = false;
        } else {
          alert("게시글을 찾을 수 없습니다.");
        }
      } else if (status === 409) {
        alert("이미 좋아요를 누른 게시글입니다.");
        // Sync state
        if (post.value) post.value.isLikedByMe = true;
      } else {
        alert("좋아요 처리에 실패했습니다.");
      }
    }
  }
};

const submitComment = async () => {
  if (!newCommentContent.value.trim()) return;
  try {
    const createRes = await communityApi.createComment(postId, { content: newCommentContent.value });

    // Optimistic update or use response
    // User spec response: 201 Created with full comment object
    const newComment = createRes.data;
    comments.value.push(newComment);
    newCommentContent.value = "";

    if (post.value) post.value.commentCount++;

    // Optionally reload to ensure sync/order if backend sorts differently
    // await fetchComments(); // Skipping to rely on response for better performance
  } catch (error: any) {
    console.error("Failed to add comment:", error);
    if (error.response) {
      const status = error.response.status;
      const msg = error.response.data?.message;

      if (status === 400) {
        alert(msg || "입력 값이 올바르지 않습니다.");
      } else if (status === 401) {
        alert("로그인이 필요합니다.");
        // router.push('/login'); // Optional
      } else if (status === 404) {
        alert("댓글을 작성할 게시글을 찾을 수 없습니다.");
      } else {
        alert("댓글 작성에 실패했습니다.");
      }
    } else {
      alert("서버 통신 오류가 발생했습니다.");
    }
  }
};

// --- Comment Edit Actions ---
const editingCommentId = ref<number | null>(null);
const editingCommentContent = ref("");

const startEditComment = (comment: CommentResponse) => {
  editingCommentId.value = comment.commentId;
  editingCommentContent.value = comment.content;
};

const cancelEditComment = () => {
  editingCommentId.value = null;
  editingCommentContent.value = "";
};

const handleUpdateComment = async (commentId: number) => {
  if (!editingCommentContent.value.trim()) return;

  try {
    const res = await communityApi.updateComment(postId, commentId, {
      content: editingCommentContent.value,
    });

    // Update local list
    const target = comments.value.find((c) => c.commentId === commentId);
    if (target) {
      target.content = res.data.content;
      target.updatedAt = res.data.updatedAt;
    }

    cancelEditComment();
    alert("댓글이 수정되었습니다.");
  } catch (error: any) {
    console.error("Failed to update comment:", error);
    if (error.response) {
      const status = error.response.status;
      if (status === 400) alert("요청 값이 올바르지 않습니다.");
      else if (status === 401) alert("로그인이 필요합니다.");
      else if (status === 403) alert("해당 댓글에 대한 권한이 없습니다.");
      else if (status === 404) alert("해당 댓글을 찾을 수 없습니다.");
      else alert("댓글 수정에 실패했습니다.");
    }
  }
};

const handleDeleteComment = async (commentId: number) => {
  if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

  try {
    await communityApi.deleteComment(postId, commentId);

    // Remove from list
    comments.value = comments.value.filter((c) => c.commentId !== commentId);
    if (post.value) post.value.commentCount--;

    alert("댓글이 삭제되었습니다.");
  } catch (error: any) {
    console.error("Failed to delete comment:", error);
    if (error.response) {
      const status = error.response.status;
      if (status === 401) alert("로그인이 필요합니다.");
      else if (status === 403) alert("해당 댓글에 대한 권한이 없습니다.");
      else if (status === 404) alert("해당 댓글을 찾을 수 없습니다.");
      else alert("댓글 삭제에 실패했습니다.");
    }
  }
};

// Util
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
  <div class="space-y-6 max-w-2xl mx-auto">
    <!-- Back Button -->
    <div>
      <Button variant="ghost" class="pl-0 text-zinc-400 hover:text-white" @click="router.back()">
        <ArrowLeft class="w-5 h-5 mr-2" />
        목록으로
      </Button>
    </div>

    <div v-if="isLoading" class="text-center py-20 text-zinc-500">로딩 중...</div>

    <div v-else-if="post" class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
      <!-- View Mode -->
      <div v-if="!isEditMode">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div @click="goToProfile(post.authorId)" class="cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar :src="post.authorProfileImageUrl" :fallback="post.authorUsername?.[0]" class="w-10 h-10" />
            </div>
            <div @click="goToProfile(post.authorId)" class="cursor-pointer hover:underline">
              <div class="text-white font-medium">{{ post.authorUsername }}</div>
              <div class="text-xs text-zinc-400">{{ formatTime(post.createdAt) }}</div>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button @click="startEdit" class="p-2 text-zinc-500 hover:text-emerald-500 transition-colors" title="수정">
              <Pencil class="w-5 h-5" />
            </button>
            <button @click="deletePost" class="p-2 text-zinc-500 hover:text-red-500 transition-colors" title="삭제">
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <h1 class="text-2xl font-bold text-white mb-4">{{ post.title }}</h1>
        <p class="text-zinc-300 leading-relaxed whitespace-pre-wrap mb-6">{{ post.content }}</p>

        <!-- Images -->
        <div v-if="post.images && post.images.length > 0" class="space-y-4 mb-6">
          <div
            v-for="(img, idx) in post.images"
            :key="idx"
            class="rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700"
          >
            <img :src="img" class="w-full h-auto" />
          </div>
        </div>

        <!-- Interaction Bar -->
        <div class="flex items-center gap-6 pt-4 border-t border-zinc-800">
          <button
            @click="toggleLike"
            class="flex items-center gap-2 transition-colors"
            :class="post.isLikedByMe ? 'text-red-500' : 'text-zinc-400 hover:text-white'"
          >
            <Heart class="w-6 h-6" :class="{ 'fill-current': post.isLikedByMe }" />
            <span>{{ post.likeCount }}</span>
          </button>
          <div class="flex items-center gap-2 text-zinc-400">
            <MessageCircle class="w-6 h-6" />
            <span>{{ post.commentCount }}</span>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-else class="space-y-4">
        <h2 class="text-xl font-bold text-white mb-4">게시글 수정</h2>

        <div class="space-y-2">
          <Label class="text-zinc-300">제목</Label>
          <Input v-model="editTitle" class="bg-zinc-800 border-zinc-700 text-white" />
        </div>

        <div class="space-y-2">
          <Label class="text-zinc-300">내용</Label>
          <Textarea v-model="editContent" :rows="8" class="bg-zinc-800 border-zinc-700 text-white" />
        </div>

        <div class="space-y-2">
          <Label class="text-zinc-300">이미지</Label>
          <div class="grid grid-cols-4 gap-2 mb-2">
            <div
              v-for="(img, idx) in editImages"
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
          <Button variant="outline" class="w-full bg-zinc-800 border-zinc-700 text-zinc-300" @click="triggerFileInput">
            <ImagePlus class="w-4 h-4 mr-2" /> 이미지 추가
          </Button>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <Button variant="outline" @click="cancelEdit" class="bg-zinc-800 border-zinc-700 text-white">취소</Button>
          <Button @click="handleUpdate" class="bg-emerald-500 hover:bg-emerald-600 text-white">수정 완료</Button>
        </div>
      </div>
    </div>

    <!-- Comments Section (Only in View Mode) -->
    <div v-if="post && !isEditMode" class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <h3 class="text-lg font-semibold text-white">댓글</h3>

      <!-- List -->
      <div class="space-y-4">
        <div v-if="comments.length === 0" class="text-center py-6 text-zinc-500">작성된 댓글이 없습니다.</div>
        <div v-for="comment in comments" :key="comment.commentId" class="flex gap-3">
          <div @click="goToProfile(comment.authorId)" class="cursor-pointer hover:opacity-80 transition-opacity h-fit">
            <Avatar
              :src="comment.authorProfileImageUrl"
              :fallback="comment.authorUsername?.[0] || '?'"
              class="w-8 h-8"
            />
          </div>
          <div class="flex-1 bg-zinc-800/50 rounded-lg p-3">
            <div class="flex items-center justify-between mb-1">
              <span
                @click="goToProfile(comment.authorId)"
                class="text-sm font-medium text-white cursor-pointer hover:underline"
                >{{ comment.authorUsername }}</span
              >
              <div class="flex items-center gap-1">
                <span class="text-xs text-zinc-500 mr-2">{{ formatTime(comment.createdAt) }}</span>
                <button
                  v-if="editingCommentId !== comment.commentId"
                  @click="startEditComment(comment)"
                  class="text-zinc-500 hover:text-emerald-500 p-1"
                  title="댓글 수정"
                >
                  <Pencil class="w-3 h-3" />
                </button>
                <button
                  v-if="editingCommentId !== comment.commentId"
                  @click="handleDeleteComment(comment.commentId)"
                  class="text-zinc-500 hover:text-red-500 p-1"
                  title="댓글 삭제"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>

            <div v-if="editingCommentId === comment.commentId" class="mt-2 space-y-2">
              <Input
                v-model="editingCommentContent"
                class="bg-zinc-900 border-zinc-700 text-white text-sm"
                @keyup.enter="handleUpdateComment(comment.commentId)"
              />
              <div class="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  @click="cancelEditComment"
                  class="h-6 w-6 text-zinc-400 hover:text-white"
                >
                  <X class="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="handleUpdateComment(comment.commentId)"
                  class="h-6 w-6 text-emerald-500 hover:text-emerald-400"
                >
                  <Send class="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p v-else class="text-sm text-zinc-200">{{ comment.content }}</p>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="flex gap-2">
        <Input
          v-model="newCommentContent"
          placeholder="댓글 작성..."
          class="bg-zinc-800 border-zinc-700 text-white"
          @keyup.enter="submitComment"
        />
        <Button @click="submitComment" class="bg-emerald-500 text-white">등록</Button>
      </div>
    </div>
  </div>
</template>
