<script setup lang="ts">
import { cn } from "@/lib/utils";
import { computed } from "vue";

const props = defineProps<{
  class?: string;
}>();

const computedClass = computed(() => {
  return cn(
    "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
    props.class
  );
});
</script>

<template>
  <label :class="computedClass" data-slot="label">
    <slot />
  </label>
</template>
