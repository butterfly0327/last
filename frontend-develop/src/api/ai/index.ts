import api from "@/api/axios";

// Interfaces
export interface MealResponse {
  menu: string;
  calories: number;
  comment: string;
}

export interface MealPlanResponse {
  generated: boolean;
  planId: number;
  targetDate: string;
  dayOfWeekKr: string;
  breakfast: MealResponse;
  lunch: MealResponse;
  dinner: MealResponse;
  totalCalories: number;
  generatedAt: string;
  rawText: string;
}

export interface MealPlanGenerateRequest {
  targetDate?: string;
}

export interface NutritionReviewResponse {
  // Define structure when known
  [key: string]: any;
}

export interface ExerciseReviewResponse {
  // Define structure when known
  [key: string]: any;
}

const BASE_URL = "/ai";

export default {
  /**
   * 오늘의 식단 추천 생성
   * POST /api/ai/meal-plans/generate
   */
  generateMealPlan: (data?: MealPlanGenerateRequest) =>
    api.post<MealPlanResponse>(`${BASE_URL}/meal-plans/generate`, data),

  /**
   * 오늘의 식단 추천 조회
   * GET /api/ai/meal-plans/dates/{targetDate}
   */
  getMealPlan: (targetDate: string) => api.get<MealPlanResponse>(`${BASE_URL}/meal-plans/dates/${targetDate}`),

  /**
   * 주간 영양 AI 평가 생성
   * POST /api/ai/nutrition-evaluations/generate
   */
  generateNutritionReview: () => api.post<NutritionReviewResponse>(`${BASE_URL}/nutrition-evaluations/generate`),

  /**
   * 주간 영양 AI 평가 조회
   * GET /api/ai/nutrition-evaluations/weeks/{anchorDate}
   */
  getNutritionReview: (anchorDate: string) =>
    api.get<NutritionReviewResponse>(`${BASE_URL}/nutrition-evaluations/weeks/${anchorDate}`),

  /**
   * 주간 운동 AI 평가 생성
   * POST /api/ai/exercise-evaluations/generate
   */
  generateExerciseReview: () => api.post<ExerciseReviewResponse>(`${BASE_URL}/exercise-evaluations/generate`),

  /**
   * 주간 운동 AI 평가 조회
   * POST /api/ai/exercise-evaluations/weeks/{anchorDate}
   * Note: User specified POST for this retrieval method.
   */
  getExerciseReview: (anchorDate: string) =>
    api.post<ExerciseReviewResponse>(`${BASE_URL}/exercise-evaluations/weeks/${anchorDate}`),
};
