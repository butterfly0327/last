import { defineStore } from "pinia";
import { computed, ref } from "vue";
import dietApi, { type Food, type FoodListParams } from "@/api/diet";
import axios from "axios";

interface ApiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
}

export const useFoodsStore = defineStore("foods", () => {
  const foods = ref<Food[]>([]);
  const foodDetails = ref<Record<number, Food>>({});
  const isLoading = ref(false);
  const errorMessage = ref<string>("");
  const lastFetchedAt = ref<number | null>(null);

  // 마지막으로 요청한 params를 보관 (재조회/UX용)
  const lastParams = ref<FoodListParams | null>(null);

  const hasFoods = computed(() => foods.value.length > 0);
  const foodById = computed(() => {
    const map = new Map<number, Food>();
    for (const f of foods.value) map.set(f.id, f);
    return (id: number) => map.get(id);
  });

  const clearError = () => {
    errorMessage.value = "";
  };

  const clearFoods = () => {
    foods.value = [];
    foodDetails.value = {};
    lastFetchedAt.value = null;
    lastParams.value = null;
  };

  const fetchFoods = async (params?: FoodListParams) => {
    console.log('🚀 [foods.ts] fetchFoods 함수 시작, params:', params);
    isLoading.value = true;
    errorMessage.value = "";
    lastParams.value = params ?? null;

    try {
      console.log('📞 [foods.ts] dietApi.getFoods 호출 전');
      const response = await dietApi.getFoods(params);
      console.log('📞 [foods.ts] dietApi.getFoods 호출 완료');
      // 디버깅: API 응답 확인
      console.log('🔍 [foods.ts] API 응답 전체:', response);
      console.log('🔍 [foods.ts] response.data:', response.data);
      console.log('🔍 [foods.ts] response.data 타입:', typeof response.data);
      console.log('🔍 [foods.ts] response.data가 배열인가?', Array.isArray(response.data));
      console.log('🔍 [foods.ts] response.data.foods:', (response.data as any)?.foods);
      console.log('🔍 [foods.ts] response.data.foods 타입:', typeof (response.data as any)?.foods);
      console.log('🔍 [foods.ts] response.data.foods가 배열인가?', Array.isArray((response.data as any)?.foods));
      console.log('🔍 [foods.ts] response.data의 모든 키:', Object.keys(response.data || {}));
      
      // 응답 구조에 따라 유연하게 처리
      let foodsArray: Food[] = [];
      const data = response.data as any;
      
      if (Array.isArray(data)) {
        // 백엔드가 직접 배열을 반환하는 경우
        console.log('✅ [foods.ts] 배열로 인식, 길이:', data.length);
        foodsArray = data;
      } else if (data?.foods && Array.isArray(data.foods)) {
        // 백엔드가 { foods: [...] } 형태로 반환하는 경우
        console.log('✅ [foods.ts] { foods: [...] } 형태로 인식, 길이:', data.foods.length);
        foodsArray = data.foods;
      } else if (data && typeof data === 'object') {
        // 다른 구조일 수 있음 - 모든 키 확인
        console.log('⚠️ [foods.ts] 예상치 못한 응답 구조:', data);
        // data 자체가 Food 객체일 수도 있음 (단일 객체)
        if (data.id && data.name) {
          console.log('✅ [foods.ts] 단일 Food 객체로 인식');
          foodsArray = [data];
        } else {
          console.log('❌ [foods.ts] 알 수 없는 응답 구조, 빈 배열 반환');
          foodsArray = [];
        }
      } else {
        console.log('❌ [foods.ts] 기본값 (빈 배열)');
        foodsArray = [];
      }
      
      foods.value = foodsArray;
      console.log('✅ [foods.ts] 최종 저장된 foods:', foods.value);
      console.log('✅ [foods.ts] foods 개수:', foods.value.length);
      if (foods.value.length > 0) {
        console.log('✅ [foods.ts] 첫 번째 food 예시:', foods.value[0]);
      }
      lastFetchedAt.value = Date.now();
      return foods.value;
    } catch (error: unknown) {
      console.error('❌ [foods.ts] fetchFoods 에러 발생:', error);
      console.error('❌ [foods.ts] 에러 타입:', typeof error);
      console.error('❌ [foods.ts] axios 에러인가?', axios.isAxiosError(error));
      if (axios.isAxiosError(error)) {
        console.error('❌ [foods.ts] error.response:', error.response);
        console.error('❌ [foods.ts] error.response?.data:', error.response?.data);
        console.error('❌ [foods.ts] error.response?.status:', error.response?.status);
      }
      
      let message = "음식 목록을 불러오는데 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        if (data?.message) message = data.message;
      }

      errorMessage.value = message;
      console.error('❌ [foods.ts] 최종 에러 메시지:', message);
      throw new Error(message);
    } finally {
      console.log('🏁 [foods.ts] fetchFoods finally 블록 실행');
      isLoading.value = false;
    }
  };

  const fetchFoodDetail = async (foodId: number) => {
    errorMessage.value = "";
    // 캐시가 있으면 즉시 반환
    if (foodDetails.value[foodId]) return foodDetails.value[foodId];

    isLoading.value = true;
    try {
      const response = await dietApi.getFoodDetail(foodId);
      const detail = response.data;

      foodDetails.value = { ...foodDetails.value, [foodId]: detail };
      // 목록에도 있으면 최신 정보로 동기화
      const idx = foods.value.findIndex((f) => f.id === foodId);
      if (idx >= 0) {
        const next = foods.value.slice();
        next[idx] = detail;
        foods.value = next;
      }

      return detail;
    } catch (error: unknown) {
      let message = "음식 상세 정보를 불러오는데 실패했습니다.";
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        if (data?.message) message = data.message;
      }
      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // state
    foods,
    foodDetails,
    isLoading,
    errorMessage,
    lastFetchedAt,
    lastParams,

    // getters
    hasFoods,
    foodById,

    // actions
    fetchFoods,
    fetchFoodDetail,
    clearFoods,
    clearError,
  };
});


