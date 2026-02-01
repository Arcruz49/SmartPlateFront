
import { AuthResponse, UserData, UserInsights, Meal } from '../types';

const BASE_URL = 'http://localhost:5052';

const getHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  auth: {
    register: async (data: any): Promise<AuthResponse> => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Registration failed');
      return res.json();
    },
    login: async (data: any): Promise<AuthResponse> => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    },
  },
  user: {
    saveData: async (token: string, data: UserData): Promise<UserData> => {
      // Sending flat JSON as per the requested format
      const res = await fetch(`${BASE_URL}/user/userdata`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save user data');
      }
      return res.json();
    },
    getData: async (token: string): Promise<UserData> => {
      const res = await fetch(`${BASE_URL}/user/userdata`, {
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to fetch user data');
      return res.json();
    },
  },
  insights: {
    generate: async (token: string): Promise<UserInsights> => {
      const res = await fetch(`${BASE_URL}/userinsights/userinsights`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to generate insights');
      return res.json();
    },
    get: async (token: string): Promise<UserInsights> => {
      const res = await fetch(`${BASE_URL}/userinsights/userinsights`, {
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    },
  },
  meals: {
    log: async (token: string, data: { mealName: string, description: string, imageBytes?: string }): Promise<Meal> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to log meal');
      return res.json();
    },
    getForDate: async (token: string, date: string): Promise<Meal[]> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal?Date=${date}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to fetch meals');
      return res.json();
    },
    getById: async (token: string, mealId: string): Promise<Meal> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermealById?MealId=${mealId}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to fetch meal details');
      return res.json();
    },
    delete: async (token: string, mealId: string): Promise<void> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal`, {
        method: 'DELETE',
        headers: getHeaders(token),
        body: JSON.stringify({ MealId: mealId }),
      });
      if (!res.ok) throw new Error('Failed to delete meal');
    },
  },
};
