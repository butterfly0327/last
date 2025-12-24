<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  src?: string;
  alt?: string;
  fallback?: string;
  class?: string;
}>();

const computedClass = computed(() => {
  return cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", props.class);
});
</script>

<template>
  <div :class="computedClass">
    <img v-if="src" :src="src" :alt="alt" class="aspect-square size-full object-cover" />
    <div v-else class="bg-zinc-700 flex size-full items-center justify-center rounded-full text-white">
      <slot>{{ fallback }}</slot>
    </div>
  </div>
</template>
