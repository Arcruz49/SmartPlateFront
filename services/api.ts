
import { AuthResponse, UserData, UserInsights, Meal, DailyMetrics, BodyMetrics } from '../types';

const API_PORT = window.location.protocol === "https:" ? 7052 : 5052;

const getServerUrl = () => {
  return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
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
    updateTargets: async (token: string, data: { targetCalories: number, proteingTargetG: number, carbsTargetG: number, fatTargetG: number }): Promise<UserInsights> => {
      const res = await fetch(`${BASE_URL}/userinsights/userinsights-rules`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },
  meals: {
    log: async (token: string, data: { mealName: string, description: string, imageBytes?: string, mealDate?: string }): Promise<Meal> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    logManual: async (token: string, data: { 
      mealName: string, 
      mealDescription: string, 
      mealDate: string, 
      mealTime: string, 
      calories: number, 
      proteinG: number, 
      carbsG: number, 
      fatG: number 
    }): Promise<any> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal-rules`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    getForDate: async (token: string, date: string): Promise<Meal[]> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal?date=${date}`, {
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
    getByBarcode: async (token: string, code: string): Promise<{
      calories: number,
      protein_g: number,
      carbs_g: number,
      fat_g: number,
      description: string,
      mealName: string
    }> => {
      const res = await fetch(`${BASE_URL}/usermeals/usermeal-barcode?Code=${code}`, {
        headers: getHeaders(token),
      });
      const data = await handleResponse(res);
      
      // Mapeamento para lidar com a estrutura aninhada retornada pelo backend
      if (data && data.product) {
        const nutriments = data.product.nutriments || {};
        const keywords = data.product._keywords || [];
        
        return {
          calories: Number(nutriments['energy-kcal']) || Number(data.calories) || 0,
          protein_g: Number(nutriments.proteins) || Number(data.protein_g) || 0,
          carbs_g: Number(nutriments.carbohydrates) || Number(data.carbs_g) || 0,
          fat_g: Number(nutriments.fat) || Number(data.fat_g) || 0,
          description: data.product.product_name || keywords.slice(0, 3).join(' ') || 'Produto Escaneado',
          mealName: data.product.product_name || keywords.slice(0, 3).join(' ') || 'Produto Escaneado'
        };
      }
      
      return data;
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
  metrics: {
    getMealMetrics: async (token: string, range: 'week' | 'month'): Promise<DailyMetrics[]> => {
      const res = await fetch(`${BASE_URL}/metrics/mealmetrics?MetricsTime=${range}`, {
        method: 'GET',
        headers: getHeaders(token),
      });
      return handleResponse(res);
    },
    getBodyMetrics: async (token: string): Promise<BodyMetrics[]> => {
      const res = await fetch(`${BASE_URL}/metrics/userbodymetrics`, {
        method: 'GET',
        headers: getHeaders(token),
      });
      return handleResponse(res);
    }
  }
};
