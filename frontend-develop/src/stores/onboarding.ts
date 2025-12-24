import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useOnboardingStore = defineStore("onboarding", () => {
  // State
  const gender = ref<"male" | "female">("male");
  const age = ref<number>(25);
  const birthDate = ref<string>("");
  const height = ref<string>("");
  const weight = ref<string>("");
  const targetWeight = ref<string>("");
  const activityLevel = ref<string>("MODERATE");
  const goals = ref<string[]>([]);
  const diseases = ref<string[]>([]);

  // Getters (Computed)
  const bmi = computed(() => {
    const h = Number(height.value);
    const w = Number(weight.value);
    if (!h || !w) return '0.0';
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(1);
  });

  // Actions
  function setGender(val: "male" | "female") {
    gender.value = val;
  }

  function setAge(val: number) {
    age.value = val;
  }

  function setBirthDate(val: string) {
    birthDate.value = val;
  }

  function setHeight(val: string | number | null) {
    height.value = val === null ? "" : String(val);
  }

  function setWeight(val: string | number | null) {
    weight.value = val === null ? "" : String(val);
  }

  function setTargetWeight(val: string | number | null) {
    targetWeight.value = val === null ? "" : String(val);
  }

  function setActivityLevel(val: string) {
    activityLevel.value = val;
  }

  function toggleGoal(goal: string) {
    const index = goals.value.indexOf(goal);
    if (index === -1) {
      goals.value.push(goal);
    } else {
      goals.value.splice(index, 1);
    }
  }

  function toggleDisease(disease: string) {
    const index = diseases.value.indexOf(disease);
    if (index === -1) {
      diseases.value.push(disease);
    } else {
      diseases.value.splice(index, 1);
    }
  }

  function reset() {
    gender.value = "male";
    age.value = 25;
    birthDate.value = "";
    height.value = "";
    weight.value = "";
    targetWeight.value = "";
    activityLevel.value = "MODERATE";
    goals.value = [];
    diseases.value = [];
  }

  return {
    gender,
    age,
    birthDate,
    height,
    weight,
    targetWeight,
    activityLevel,
    goals,
    diseases,
    bmi,
    setGender,
    setAge,
    setBirthDate,
    setHeight,
    setWeight,
    setTargetWeight,
    setActivityLevel,
    toggleGoal,
    toggleDisease,
    reset,
  };
});
