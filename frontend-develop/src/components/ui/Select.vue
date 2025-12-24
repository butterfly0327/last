<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-vue-next";

const props = defineProps<{
  modelValue?: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const computedClass = computed(() => {
  return cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    props.class
  );
});
</script>

<template>
  <div class="relative">
    <select
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      :disabled="disabled"
      :class="cn(computedClass, 'appearance-none pr-8')"
    >
      <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
      <slot>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </slot>
    </select>
    <ChevronDown class="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
  </div>
</template>
