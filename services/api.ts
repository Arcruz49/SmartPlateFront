
import { AuthResponse, UserData, UserInsights, Meal } from '../types';

const getServerUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:5052`;
};

const BASE_URL = getServerUrl();

const getHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'API Request failed');
  }
  return res.json();
};

export const api = {
  auth: {
    register: async (data: any): Promise<AuthResponse> => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    login: async (data: any): Promise<AuthResponse> => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },
  user: {
    saveData: async (token: string, data: UserData): Promise<UserData> => {
      const res = await fetch(`${BASE_URL}/user/userdata`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    getData: async (token: string): Promise<UserData> => {
      const res = await fetch(`${BASE_URL}/user/userdata`, {
        headers: getHeaders(token),
      });
      return handleResponse(res);
    },
  },
  insights: {
    generate: async (token: string): Promise<UserInsights> => {
      const res = await fetch(`${BASE_URL}/userinsights/userinsights`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({}),
      });
      return handleResponse(res);
    },
    get: async (token: string): Promise<UserInsights> => {
      const res = await fetch(`${BASE_URL}/userinsights/userinsights`, {
        headers: getHeaders(token),
      });
      return handleResponse(res);
    },
  },
  meals: {
    log: async (token: string, data: { mealName: string, description: string, imageBytes?: string }): Promise<Meal> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    getForDate: async (token: string, date: string): Promise<Meal[]> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal?Date=${date}`, {
        headers: getHeaders(token),
      });
      return handleResponse(res);
    },
    getById: async (token: string, mealId: string): Promise<Meal> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermealById?MealId=${mealId}`, {
        headers: getHeaders(token),
      });
      return handleResponse(res);
    },
    delete: async (token: string, mealId: string): Promise<void> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal`, {
        method: 'DELETE',
        headers: getHeaders(token),
        body: JSON.stringify({ MealId: mealId }),
      });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error('Failed to delete meal');
    },
  },
};
