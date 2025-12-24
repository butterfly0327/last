import api from '@/api/axios';

const BASE_URL = '/challenges';

// --- Types ---

export interface ChallengeSummary {
    challengeId: number;
    title: string;
    shortDescription: string;
    goalSummary: string;
    ruleDescription?: string | null;
    imageUrl: string;
    type: 'PUBLIC';
    goalType: string;
    recruitStartDate: string;
    recruitEndDate: string;
    startDate: string;
    endDate: string;
    participantsCount: number;
    isJoined: boolean;
    selectedDifficulty?: string | null;
    requiredSuccessDays?: number | null;
    dailyTargetValue?: number | null;
    successDays?: number | null;
    progressPercentage?: number | null;
}

export interface ChallengeListResponse {
    month: string; // YYYY-MM
    challenges: ChallengeSummary[];
}

export interface DifficultyOption {
    dailyTargetValue: number | null;
    difficultyCode: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    requiredSuccessDays: number;
    rewardTitleDescription: string;
    rewardTitleIconEmoji: string;
    rewardTitleId: number;
    rewardTitleName: string;
}

export interface ChallengeDetailResponse {
    challengeId: number;
    title: string;
    shortDescription: string;
    goalSummary: string;
    ruleDescription?: string | null;
    imageUrl: string;
    type: 'PUBLIC';
    goalType: string;
    recruitStartDate: string;
    recruitEndDate: string;
    startDate: string;
    endDate: string;
    participantsCount: number;
    isJoined: boolean;
    selectedDifficulty?: string | null;
    requiredSuccessDays?: number | null;
    dailyTargetValue?: number | null;
    successDays?: number | null;
    progressPercentage?: number | null;
    difficultyOptions?: DifficultyOption[];
}

export interface ChallengeJoinResponse {
    challengeId: number;
    title: string;
    joined: boolean;
    joinedAt: string;
    difficultyCode: string;
    requiredSuccessDays: number;
    dailyTargetValue?: number | null;
    myStartDate: string;
    myEndDate: string;
}

export interface ChallengeLeaveResponse {
    challengeId: number;
    left: boolean;
    leftAt: string;
}

export default {
    /**
     * 챌린지 목록 조회
     * GET /api/challenges?month=YYYY-MM
     */
    getChallenges: (month: string) =>
        api.get<ChallengeListResponse>(BASE_URL, { params: { month } }),

    /**
     * 개별 챌린지 상세조회
     * GET /api/challenges/{challengeId}
     */
    getChallengeDetail: (challengeId: number) =>
        api.get<ChallengeDetailResponse>(`${BASE_URL}/${challengeId}`),

    /**
     * 챌린지 참여
     * POST /api/challenges/{challengeId}/join
     * Body: { difficultyCode: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" }
     */
    joinChallenge: (challengeId: number, difficultyCode: string) =>
        api.post<ChallengeJoinResponse>(`${BASE_URL}/${challengeId}/join`, { difficultyCode }),

    /**
     * 챌린지 나가기 / 취소
     * DELETE /api/challenges/{challengeId}/leave
     */
    leaveChallenge: (challengeId: number) =>
        api.delete<ChallengeLeaveResponse>(`${BASE_URL}/${challengeId}/leave`),
};
