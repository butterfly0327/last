import api from '@/api/axios';

const BASE_URL = '/users';

// --- Interfaces ---

export interface BasicInfo {
    userId: number;
    email: string;
    username: string;
    profileImageUrl: string;
    introduction: string;
    createdAt: string;
}

export interface HealthInfo {
    birthDate: string;
    height: number;
    weight: number;
    goalWeight: number;
    hasDiabetes: boolean;
    hasHypertension: boolean;
    hasHyperlipidemia: boolean;
    otherDisease: string | null;
    goal: string | null;
    activityLevel: string | null;
}

// Title (Badge) Interface
export interface Title {
    titleId: number;
    name: string;
    description: string;
    iconEmoji: string;
    difficultyName: string | null;
    obtainedAt: string;
    sourceChallengeId: number;
}

// Badge/Title Collection in MyPage
export interface BadgeCollection {
    currentTitleId: number | null;
    currentTitleName: string | null;
    titles: Title[];
}

export interface FollowCount {
    followersCount: number;
    followingsCount: number;
}

export interface MyPageResponse {
    basic: BasicInfo;
    health: HealthInfo;
    badges: BadgeCollection;
    follow: FollowCount;
}

// Simple User Summary for Follow lists
export interface UserSummary {
    userId: number;
    username: string;
    profileImageUrl: string;
    introduction?: string;
    isFollowingBack: boolean;
    isFollowing?: boolean; // For followers list
}

export interface FollowListResponse {
    totalCount: number;
    users: UserSummary[];
}

export interface UserProfileResponse {
    basic: {
        userId: number;
        username: string;
        profileImageUrl: string;
        introduction: string;
    };
    badges: {
        currentTitleId: number | null;
        currentTitleName: string | null;
        currentIconEmoji: string | null;
        titles: Title[];
    };
    follow: {
        followersCount: number;
        followingsCount: number;
        following: boolean;
    };
}

export interface FollowResponse {
    targetUserId: number;
    following: boolean;
    followedAt?: string;
    unfollowedAt?: string;
}

export default {
    /**
     * 상대방 프로필 조회
     * GET /api/users/{userId}
     */
    getUserProfile: (userId: number) =>
        api.get<UserProfileResponse>(`${BASE_URL}/${userId}`),

    /**
     * 내 정보 조회 (마이페이지)
     * GET /api/users/me/mypage
     */
    getMyPage: () =>
        api.get<MyPageResponse>(`${BASE_URL}/me/mypage`),

    /**
     * 내 기본정보 수정
     * PATCH /api/users/me/basic
     */
    updateMyBasicInfo: (data: Partial<BasicInfo>) =>
        api.patch(`${BASE_URL}/me/basic`, data),

    /**
     * 내 건강정보 수정
     * PATCH /api/users/me/health
     */
    updateMyHealthInfo: (data: Partial<HealthInfo>) =>
        api.patch(`${BASE_URL}/me/health`, data),

    /**
     * 대표 뱃지 설정/해제
     * PATCH /api/users/me/title
     * Body: { titleId: number | null }
     */
    updateMyCurrentTitle: (titleId: number | null) =>
        api.patch(`${BASE_URL}/me/title`, { titleId }),

    /**
     * 내 뱃지 목록 조회
     * GET /api/users/me/titles
     */
    getMyTitles: () =>
        api.get<Title[]>(`${BASE_URL}/me/titles`),

    /**
     * 대표 뱃지 조회
     * GET /api/users/me/title
     */
    getMyCurrentTitle: () =>
        api.get<Title>(`${BASE_URL}/me/title`),

    /**
     * 내가 팔로우하는 유저 조회
     * GET /api/users/me/followings
     */
    getMyFollowings: () =>
        api.get<FollowListResponse>(`${BASE_URL}/me/followings`),

    /**
     * 나를 팔로우하는 유저 조회
     * GET /api/users/me/followers
     */
    getMyFollowers: () =>
        api.get<FollowListResponse>(`${BASE_URL}/me/followers`),

    /**
     * 팔로우하기
     * POST /api/users/{userId}/follow
     */
    followUser: (userId: number) =>
        api.post<FollowResponse>(`${BASE_URL}/${userId}/follow`),

    /**
     * 팔로우 취소
     * DELETE /api/users/{userId}/follow
     */
    unfollowUser: (userId: number) =>
        api.delete<FollowResponse>(`${BASE_URL}/${userId}/follow`),
};
