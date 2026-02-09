const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('cadmin_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('cadmin_token', token);
    } else {
      localStorage.removeItem('cadmin_token');
    }
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401 && path !== '/auth/login') {
        this.setToken(null);
        window.location.href = '/login';
      }
      throw new Error(data?.error || `Request failed: ${res.status}`);
    }
    return data;
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  patch(path, body) { return this.request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
