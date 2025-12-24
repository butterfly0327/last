<script setup lang="ts">
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { computed, useAttrs } from "vue";

// root 엘리먼트로 attrs(type, disabled, aria-*, onClick 등)를 정확히 전달하기 위해 사용
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface Props {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  class?: string;
  asChild?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  asChild: false,
});

const computedClass = computed(() => {
  return cn(buttonVariants({ variant: props.variant, size: props.size }), props.class);
});
</script>

<template>
  <!--
    NOTE:
    - 기존 구현은 type/disabled/click 등의 attrs가 실제 button에 적용되지 않을 수 있음.
    - asChild는 현재 코드베이스에서 사용되지 않아, 최소한의 호환성을 위해 span wrapper로 유지.
  -->
  <component :is="asChild ? 'span' : 'button'" v-bind="attrs" :class="computedClass">
    <slot />
  </component>
</template>
