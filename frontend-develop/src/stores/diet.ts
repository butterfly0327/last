import { defineStore } from "pinia";
import { ref } from "vue";
import dietApi, { 
  type CreateMyDietRequest, 
  type CreateMyDietResponse,
  type DeleteMyDietResponse,
  type UpdateMyDietRequest,
  type UpdateMyDietResponse,
  type GetMyDietsResponse,
  type GetMyDietDetailResponse
} from "@/api/diet";
import axios from "axios";

interface ApiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
}

export const useDietStore = defineStore("diet", () => {
  const isCreating = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const isLoadingDiets = ref(false);
  const isLoadingDietDetail = ref(false);
  const errorMessage = ref<string>("");
  const lastCreatedDietId = ref<CreateMyDietResponse | null>(null);
  const lastDeletedDietId = ref<number | null>(null);
  const lastUpdatedDiet = ref<UpdateMyDietResponse | null>(null);
  const myDiets = ref<GetMyDietsResponse | null>(null);
  const myDietDetail = ref<GetMyDietDetailResponse | null>(null);

  const clearError = () => {
    errorMessage.value = "";
  };

  const createMyDiet = async (payload: CreateMyDietRequest) => {
    isCreating.value = true;
    errorMessage.value = "";

    try {
      console.log('📞 [diet.ts] createMyDiet 호출, payload:', JSON.stringify(payload, null, 2));
      const response = await dietApi.createMyDiet(payload);
      console.log('✅ [diet.ts] createMyDiet 응답:', response);
      lastCreatedDietId.value = response.data;
      return response.data;
    } catch (error: unknown) {
      let message = "식단 저장에 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ [diet.ts] createMyDiet 에러 응답:', error.response);
        console.error('❌ [diet.ts] 에러 응답 데이터:', error.response.data);
        console.error('❌ [diet.ts] 에러 상태 코드:', error.response.status);
        const data = error.response.data as ApiErrorResponse | undefined;
        if (data?.message) message = data.message;
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isCreating.value = false;
    }
  };

  const deleteMyDiet = async (dietId: number) => {
    isDeleting.value = true;
    errorMessage.value = "";

    try {
      const response = await dietApi.deleteMyDiet(dietId);
      lastDeletedDietId.value = response.data.dietId;
      return response.data;
    } catch (error: unknown) {
      let message = "식단 삭제에 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        const status = error.response.status;

        if (status === 401) {
          message = "액세스 토큰이 유효하지 않습니다.";
        } else if (status === 403) {
          message = "해당 식단을 삭제할 권한이 없습니다.";
        } else if (status === 404) {
          message = "삭제할 식단을 찾을 수 없습니다.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isDeleting.value = false;
    }
  };

  const updateMyDiet = async (dietId: number, payload: UpdateMyDietRequest) => {
    isUpdating.value = true;
    errorMessage.value = "";

    try {
      const response = await dietApi.updateMyDiet(dietId, payload);
      lastUpdatedDiet.value = response.data;
      return response.data;
    } catch (error: unknown) {
      let message = "식단 수정에 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        const status = error.response.status;

        if (status === 400) {
          message = "요청 값이 올바르지 않습니다.";
        } else if (status === 401) {
          message = "액세스 토큰이 유효하지 않습니다.";
        } else if (status === 403) {
          message = "해당 식단을 수정할 권한이 없습니다.";
        } else if (status === 404) {
          message = "수정할 식단을 찾을 수 없습니다.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isUpdating.value = false;
    }
  };

  const getMyDiets = async (date: string) => {
    isLoadingDiets.value = true;
    errorMessage.value = "";

    try {
      console.log('📞 [diet.ts] getMyDiets 호출, date:', date);
      const response = await dietApi.getMyDiets(date);
      console.log('✅ [diet.ts] getMyDiets 응답:', response);
      console.log('✅ [diet.ts] response.data:', response.data);
      console.log('✅ [diet.ts] response.data 타입:', typeof response.data);
      console.log('✅ [diet.ts] response.data가 배열인가?', Array.isArray(response.data));
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        console.log('✅ [diet.ts] response.data의 모든 키:', Object.keys(response.data));
        console.log('✅ [diet.ts] response.data.diets:', response.data.diets);
        console.log('✅ [diet.ts] response.data.diets 타입:', typeof response.data.diets);
        console.log('✅ [diet.ts] response.data.diets가 배열인가?', Array.isArray(response.data.diets));
      }
      myDiets.value = response.data;
      return response.data;
    } catch (error: unknown) {
      let message = "식단 목록을 불러오는데 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        const status = error.response.status;

        if (status === 400) {
          message = "요청 값이 올바르지 않습니다.";
        } else if (status === 401) {
          message = "액세스 토큰이 유효하지 않습니다.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isLoadingDiets.value = false;
    }
  };

  const getMyDietDetail = async (dietId: number) => {
    isLoadingDietDetail.value = true;
    errorMessage.value = "";

    try {
      console.log(`📞 [diet.ts] getMyDietDetail 호출, dietId:`, dietId);
      const response = await dietApi.getMyDietDetail(dietId);
      console.log(`✅ [diet.ts] getMyDietDetail 응답:`, response);
      console.log(`✅ [diet.ts] response.data:`, response.data);
      console.log(`✅ [diet.ts] response.data.items:`, response.data.items);
      console.log(`✅ [diet.ts] response.data.items 타입:`, typeof response.data.items);
      console.log(`✅ [diet.ts] response.data.items가 배열인가?`, Array.isArray(response.data.items));
      if (response.data.items && Array.isArray(response.data.items)) {
        console.log(`✅ [diet.ts] items 개수:`, response.data.items.length);
        if (response.data.items.length > 0) {
          console.log(`✅ [diet.ts] 첫 번째 item:`, response.data.items[0]);
        }
      }
      myDietDetail.value = response.data;
      return response.data;
    } catch (error: unknown) {
      let message = "식단 상세 정보를 불러오는데 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        const status = error.response.status;

        if (status === 401) {
          message = "액세스 토큰이 유효하지 않습니다.";
        } else if (status === 403) {
          message = "해당 식단에 접근할 권한이 없습니다.";
        } else if (status === 404) {
          message = "해당 식단을 찾을 수 없습니다.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isLoadingDietDetail.value = false;
    }
  };

  return {
    isCreating,
    isDeleting,
    isUpdating,
    isLoadingDiets,
    isLoadingDietDetail,
    errorMessage,
    lastCreatedDietId,
    lastDeletedDietId,
    lastUpdatedDiet,
    myDiets,
    myDietDetail,
    createMyDiet,
    deleteMyDiet,
    updateMyDiet,
    getMyDiets,
    getMyDietDetail,
    clearError,
  };
});


