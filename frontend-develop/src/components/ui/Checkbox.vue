<script setup lang="ts">
import { computed } from "vue";
import { Check } from "lucide-vue-next";
import { cn } from "@/lib/utils";

const props = defineProps<{
  checked?: boolean;
  disabled?: boolean;
  class?: string;
  id?: string;
}>();

const emit = defineEmits<{
  (e: "update:checked", value: boolean): void;
  (e: "change", value: boolean): void;
}>();

const toggle = () => {
  if (props.disabled) return;
  const newValue = !props.checked;
  emit("update:checked", newValue);
  emit("change", newValue);
};

const computedClass = computed(() => {
  return cn(
    "peer border bg-input-background dark:bg-input/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center cursor-pointer",
    props.class
  );
});
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :disabled="disabled"
    :data-state="checked ? 'checked' : 'unchecked'"
    :class="computedClass"
    @click="toggle"
    :id="id"
  >
    <Check v-if="checked" class="size-3.5 text-current" />
  </button>
</template>
