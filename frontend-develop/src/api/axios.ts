import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api', // Default fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Check if error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Dynamically import auth store to avoid circular dependency
      const { useAuthStore } = await import('@/stores/auth');
      const authStore = useAuthStore();

      try {
        const success = await authStore.refreshAccessToken();

        if (success) {
          const newToken = authStore.token;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          processQueue(new Error('Token refresh failed'), null);
          // Redirect to login (preserve a one-time message)
          try {
            sessionStorage.setItem(
              'flash_message',
              JSON.stringify({
                type: 'error',
                message: '세션이 만료되었습니다. 다시 로그인해주세요.',
                at: Date.now(),
              })
            );
          } catch {
            // ignore storage errors
          }
          window.location.href = '/';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        try {
          sessionStorage.setItem(
            'flash_message',
            JSON.stringify({
              type: 'error',
              message: '세션이 만료되었습니다. 다시 로그인해주세요.',
              at: Date.now(),
            })
          );
        } catch {
          // ignore storage errors
        }
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
