import { apiRequest } from "./queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
}

// LocalStorage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Helper functions
export const setAuth = (authResponse: AuthResponse) => {
  localStorage.setItem(TOKEN_KEY, authResponse.token);
  localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// React Query hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const data: AuthResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setAuth(data);
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    }
  });
};

export const useLogout = () => {
  return () => {
    clearAuth();
    queryClient.clear();
    window.location.href = '/';
  };
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      if (!isAuthenticated()) {
        return null;
      }
      
      try {
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        return await response.json();
      } catch (error) {
        clearAuth();
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
    enabled: isAuthenticated()
  });
};
