import api from "@/api/axios";

// --- Interfaces ---

export type ExerciseType = "맨몸 운동" | "웨이트" | "유산소" | "스트레칭" | "스포츠";

export interface Exercise {
  exerciseId: number;
  name: string;
  description: string;
  type: ExerciseType;
  met: number;
  intensityLevel: string; // "낮음", "중간", "높음" etc.
}

export interface ExerciseRecordListItem {
  durationMinutes: number;
  exerciseId: number;
  exerciseName: string;
  intensityLevel: string;
  met: number;
  type: string;
  // Note: recordId is missing in the user provided list example.
  // We might need it for edit/delete, but sticking to spec for now.
  recordId?: number;
}

export interface ExerciseRecordDetail {
  calories: number;
  durationMinutes: number;
  exerciseId: number;
  exerciseName: string;
  intensityLevel: string;
  met: number;
  recordedAt: string; // Changed from recordDate
  recordId: number;
  type: string;
}

export type ExerciseRecord = ExerciseRecordDetail;

export interface ExerciseRecordCreateRequest {
  exerciseId: number;
  durationMinutes: number;
  recordedAt: string; // YYYY-MM-DDTHH:mm:ss Changed from recordDate
  notes?: string;
}

export interface ExerciseRecordUpdateRequest {
  exerciseId?: number; // Added based on user request body example
  durationMinutes?: number;
  recordedAt?: string; // Changed from recordDate
  notes?: string;
}

// --- API Definition ---

const EXERCISE_URL = "/exercises";
const MY_RECORD_URL = "/me/exercise-records";

export default {
  /**
   * 전체 운동 조회
   * GET /api/exercises
   */
  getExercises: () => api.get<Exercise[]>(EXERCISE_URL),

  /**
   * 운동 기록 조회
   * GET /api/me/exercise-records?date=YYYY-MM-DD
   */
  getMyExerciseRecords: (date: string) => api.get<ExerciseRecordListItem[]>(MY_RECORD_URL, { params: { date } }),

  /**
   * 운동 기록 상세조회
   * GET /api/me/exercise-records/{recordId}
   */
  getMyExerciseRecordDetail: (recordId: number) => api.get<ExerciseRecordDetail>(`${MY_RECORD_URL}/${recordId}`),

  /**
   * 운동 기록 추가 (Batch)
   * POST /api/me/exercise-records
   */
  createMyExerciseRecords: (data: ExerciseRecordCreateRequest[]) => api.post<ExerciseRecord[]>(MY_RECORD_URL, data),

  /**
   * 운동 기록 수정
   * PUT /api/me/exercise-records/{recordId}
   */
  updateMyExerciseRecord: (recordId: number, data: ExerciseRecordUpdateRequest) =>
    api.put<ExerciseRecord>(`${MY_RECORD_URL}/${recordId}`, data),

  /**
   * 운동 기록 삭제
   * DELETE /api/me/exercise-records/{recordId}
   */
  deleteMyExerciseRecord: (recordId: number) => api.delete(`${MY_RECORD_URL}/${recordId}`),
};
