
// Basic JWT payload decoder
export function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const TokenService = {
  getAccessToken(): string | null {
    return localStorage.getItem("token");
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  },

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  clearTokens() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    // Trigger an event to let components (like AuthContext) know to logout
    window.dispatchEvent(new Event("auth-logout"));
  },

  isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    
    // Check if token expires in less than 30 seconds
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime + 30;
  },

  getPayload(token: string) {
    return decodeJwtPayload(token);
  }
};
