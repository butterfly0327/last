<script setup lang="ts">
import { X } from "lucide-vue-next";

defineProps<{
  open: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const close = () => emit("update:open", false);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      @click="close"
    >
      <div class="relative w-full max-w-lg p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h2 v-if="title" class="text-lg font-semibold text-white">{{ title }}</h2>
          <button @click="close" class="text-zinc-400 hover:text-white transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
