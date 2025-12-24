import api from "@/api/axios";

const BASE_URL = "/me/stats";

export default {
  /**
   * 주간 통계 조회
   * GET /api/me/stats/week?date=YYYY-MM-DD
   */
  getWeeklyStats: (date: string) => api.get(`${BASE_URL}/week`, { params: { date } }),

  /**
   * 주간 영양 AI 평가 생성
   * POST /api/ai/nutrition-evaluations/generate
   */
  generateNutritionReview: (data?: { anchorDate: string }) => api.post(`/ai/nutrition-evaluations/generate`, data),

  /**
   * 주간 영양 AI 평가 조회
   * GET /api/ai/nutrition-evaluations/weeks/{anchorDate}
   */
  getNutritionReview: (anchorDate: string) => api.get(`/ai/nutrition-evaluations/weeks/${anchorDate}`),

  /**
   * 주간 운동 AI 평가 생성
   * POST /api/ai/exercise-evaluations/generate
   */
  generateExerciseReview: (data?: { anchorDate: string }) => api.post(`/ai/exercise-evaluations/generate`, data),

  /**
   * 주간 운동 AI 평가 조회
   * GET /api/ai/exercise-evaluations/weeks/{anchorDate}
   */
  getExerciseReview: (anchorDate: string) => api.get(`/ai/exercise-evaluations/weeks/${anchorDate}`),
};
