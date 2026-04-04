import axios from "axios";
import { TokenService } from "./tokenService";
import { jwtDecode } from "jwt-decode";

// Default to API Gateway via environment variable or fallback to localhost:8080
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Inventory service URL (port 8082)
export const INVENTORY_BASE_URL = import.meta.env.VITE_INVENTORY_URL || "http://localhost:8082";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Separate axios instance for inventory service
export const inventoryApi = axios.create({
  baseURL: INVENTORY_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const isAuthRequest = (url?: string) => {
  return url?.includes("/auth/login") || url?.includes("/auth/register") || url?.includes("/auth/oauth/token");
};

// Interceptor to add JWT token to every request and check expiration
api.interceptors.request.use(
  async (config) => {
    // Skip interceptor for authentication requests
    if (isAuthRequest(config.url)) {
      return config;
    }

    let token = TokenService.getAccessToken();
    const refreshToken = TokenService.getRefreshToken();

    // Safety check for corrupted tokens (literally translated as string "undefined" or "null")
    if (token === "undefined" || token === "null") {
      TokenService.clearTokens();
      token = null;
    }

    if (token) {
      // Extract userId from token to satisfy backend @RequestHeader requirements
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.userId) {
          config.headers["X-User-Id"] = decoded.userId;
        }
      } catch (e) {
        console.error("Token decoding failed", e);
      }

      // Check if access token is expired or close to it
      if (TokenService.isTokenExpired(token) && refreshToken) {
        // Only try to refresh if not already refreshing
        if (!isRefreshing) {
          try {
            isRefreshing = true;
            const response = await axios.post(`${API_BASE_URL}/auth/oauth/refresh`, {
              refreshToken,
            });
            const { token, access_token } = response.data;
            const newAccessToken = access_token || token;
            
            if (!newAccessToken) {
              throw new Error("No access token in refresh response");
            }

            TokenService.setTokens(newAccessToken, refreshToken);
            config.headers.Authorization = `Bearer ${newAccessToken}`;

            isRefreshing = false;
            return config;
          } catch (refreshError) {
            isRefreshing = false;
            TokenService.clearTokens();
            return Promise.reject(refreshError);
          }
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry logic for authentication requests
    if (isAuthRequest(originalRequest.url)) {
      return Promise.reject(error);
    }

    // If 401 response and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenService.getRefreshToken();
      if (!refreshToken) {
        TokenService.clearTokens();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/oauth/refresh`, {
          refreshToken,
        });

        const { token, access_token } = response.data;
        const newAccessToken = access_token || token;

        if (!newAccessToken) {
          TokenService.clearTokens();
          return Promise.reject(new Error("No access token in refresh response"));
        }

        TokenService.setTokens(newAccessToken, refreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        TokenService.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor for inventory API
inventoryApi.interceptors.request.use(
  async (config) => {
    let token = TokenService.getAccessToken();
    const refreshToken = TokenService.getRefreshToken();

    if (token === "undefined" || token === "null") {
      TokenService.clearTokens();
      token = null;
    }

    if (token) {
      // Extract userId from token
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.userId) {
          config.headers["X-User-Id"] = decoded.userId;
        }
      } catch (e) {
        // ignore decoding errors here
      }

      if (TokenService.isTokenExpired(token) && refreshToken) {
        if (!isRefreshing) {
          try {
            isRefreshing = true;
            const response = await axios.post(`${API_BASE_URL}/auth/oauth/refresh`, {
              refreshToken,
            });
            const { token: newToken, access_token } = response.data;
            const newAccessToken = access_token || newToken;

            if (!newAccessToken) {
              throw new Error("No access token in refresh response");
            }

            TokenService.setTokens(newAccessToken, refreshToken);
            config.headers.Authorization = `Bearer ${newAccessToken}`;

            isRefreshing = false;
            return config;
          } catch (refreshError) {
            isRefreshing = false;
            TokenService.clearTokens();
            return Promise.reject(refreshError);
          }
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for inventory API
inventoryApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return inventoryApi(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenService.getRefreshToken();
      if (!refreshToken) {
        TokenService.clearTokens();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/oauth/refresh`, {
          refreshToken,
        });

        const { token: newToken, access_token } = response.data;
        const newAccessToken = access_token || newToken;

        if (!newAccessToken) {
          TokenService.clearTokens();
          return Promise.reject(new Error("No access token in refresh response"));
        }

        TokenService.setTokens(newAccessToken, refreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        isRefreshing = false;

        return inventoryApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        TokenService.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
