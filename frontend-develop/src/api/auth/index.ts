import api from '@/api/axios';

export interface SignUpRequest {
    email: string;
    username: string;
    password: string;
}

export interface SignUpResponse {
    email: string;
    username: string;
}

export interface CheckEmailResponse {
    available: boolean;
    email: string;
}

export interface CheckUsernameResponse {
    available: boolean;
    username: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
}

export interface WithdrawRequest {
    password: string;
    refreshToken: string;
}

export interface WithdrawResponse {
    message: string;
}

export default {
    signIn: (credentials: any) => api.post('/auth/sign-in', credentials),
    signOut: (data: { refreshToken: string }) => api.post('/auth/sign-out', data),
    signUp: (data: SignUpRequest) => api.post<SignUpResponse>('/auth/sign-up', data),
    isEmailAvailable: (email: string) => api.get<CheckEmailResponse>('/auth/check-email', { params: { email } }),
    isUsernameAvailable: (username: string) => api.get<CheckUsernameResponse>('/auth/check-username', { params: { username } }),
    refreshToken: (data: RefreshTokenRequest) => api.post<RefreshTokenResponse>('/auth/refresh', data),
    // NOTE: 백엔드가 DELETE로 탈퇴를 구현한 경우를 우선 지원합니다.
    // axios의 delete는 body를 config.data로 전달해야 합니다.
    withdraw: (data: WithdrawRequest) => api.delete<WithdrawResponse>('/auth/withdraw', { data }),
};
