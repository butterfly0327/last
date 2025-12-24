<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{
  modelValue: string;
  options: { label: string; value: string }[];
  class?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div
    :class="
      cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', props.class)
    "
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      @click="emit('update:modelValue', option.value)"
      :class="
        cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          modelValue === option.value
            ? 'bg-background text-foreground shadow-sm bg-emerald-500 text-white'
            : 'hover:bg-zinc-800 hover:text-white text-zinc-400'
        )
      "
    >
      {{ option.label }}
    </button>
  </div>
</template>
