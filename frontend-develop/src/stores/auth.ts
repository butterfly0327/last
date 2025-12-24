import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import api from '@/api/axios';

interface UserInfo {
    email: string;
    username: string;
}

interface LoginResponse {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
    tokenType: string;
    userInfo: UserInfo;
}

interface WithdrawResponse {
    message: string;
}

interface ErrorResponse {
    status: number;
    message?: string;
    error?: string;
    code?: string;
}

export const useAuthStore = defineStore('auth', () => {
    // Parser helper for safe JSON parsing
    const safeParse = (key: string) => {
        try {
            return JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
            return null;
        }
    };

    const user = ref<UserInfo | null>(safeParse('user'));
    const token = ref(localStorage.getItem('token') || '');
    const refreshToken = ref(localStorage.getItem('refreshToken') || '');

    const isAuthenticated = computed(() => !!token.value);

    async function login(credentials: any) {
        try {
            const response = await api.post<LoginResponse>('/auth/sign-in', credentials);

            const {
                accessToken,
                refreshToken: newRefreshToken,
                userInfo
            } = response.data;

            token.value = accessToken;
            refreshToken.value = newRefreshToken;
            user.value = userInfo;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('user', JSON.stringify(userInfo));

            return true;
        } catch (error: any) {
            let message = '로그인에 실패했습니다.';

            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data as ErrorResponse;

                // Prioritize 'message' field from server
                if (data.message) {
                    message = data.message;
                } else if (data.error) {
                    message = data.error;
                } else if (error.response.status === 401) {
                    message = '인증에 실패했습니다.';
                }
            }

            // Allow component to catch and display the message
            throw new Error(message);
        }
    }

    async function refreshAccessToken(): Promise<boolean> {
        try {
            if (!refreshToken.value) {
                return false;
            }

            const response = await api.post('/auth/refresh', {
                refreshToken: refreshToken.value
            });

            const {
                accessToken,
                refreshToken: newRefreshToken,
            } = response.data;

            token.value = accessToken;
            refreshToken.value = newRefreshToken;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear tokens on refresh failure
            token.value = '';
            refreshToken.value = '';
            user.value = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('chat_conversation_id');
            return false;
        }
    }

    async function logout() {
        try {
            if (refreshToken.value) {
                await api.post('/auth/sign-out', { refreshToken: refreshToken.value });
            }
        } catch (error) {
            console.error('Logout failed on server:', error);
        } finally {
            token.value = '';
            refreshToken.value = '';
            user.value = null;

            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('chat_conversation_id');
        }
    }

    async function withdraw(password: string): Promise<string> {
        try {
            if (!refreshToken.value) {
                throw new Error('인증 정보가 없습니다.');
            }

            const payload = {
                password,
                refreshToken: refreshToken.value
            };

            // NOTE: 백엔드가 POST를 지원하지 않는 경우가 있어(405/메서드 불일치),
            // 기본은 DELETE로 호출하고 필요 시 POST로 한 번 더 시도합니다.
            let responseMessage = '회원 탈퇴가 완료되었습니다.';
            try {
                const response = await api.delete<WithdrawResponse>('/auth/withdraw', { data: payload });
                if (response?.data?.message) responseMessage = response.data.message;
            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response?.status === 405) {
                    const response = await api.post<WithdrawResponse>('/auth/withdraw', payload);
                    if (response?.data?.message) responseMessage = response.data.message;
                } else {
                    throw err;
                }
            }

            // Clear all auth data
            token.value = '';
            refreshToken.value = '';
            user.value = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('chat_conversation_id');

            return responseMessage;
        } catch (error: any) {
            console.error('Withdrawal failed:', error);

            let message = '회원 탈퇴에 실패했습니다.';
            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data as ErrorResponse;
                if (data.message) {
                    message = data.message;
                } else if (data.error) {
                    message = data.error;
                }
            }

            throw new Error(message);
        }
    }

    return {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        refreshAccessToken,
        withdraw
    };
});
