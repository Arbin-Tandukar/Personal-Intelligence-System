/* ============================================================
   API Wrapper — Personal Intelligence System
   Handles all HTTP communication with the backend
   ============================================================ */

class API {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.tokenKey = 'pis_auth_token';
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    clearToken() {
        localStorage.removeItem(this.tokenKey);
    }

    async request(method, endpoint, data = null, params = null) {
        const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    url.searchParams.append(key, value);
                }
            });
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url.toString(), config);

            if (response.status === 401) {
                this.clearToken();
                if (typeof Auth !== 'undefined') {
                    Auth.showLogin();
                }
                throw new Error('Authentication required. Please log in.');
            }

            if (response.status === 204) {
                return null;
            }

            const responseData = await response.json();

            if (!response.ok) {
                const errorMessage = responseData.detail || responseData.message || `Request failed (${response.status})`;
                throw new Error(errorMessage);
            }

            return responseData;
        } catch (error) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                showToast('Unable to connect to server. Please check your connection.', 'error');
                throw new Error('Network error');
            }
            throw error;
        }
    }

    async get(endpoint, params = null) {
        return this.request('GET', endpoint, null, params);
    }

    async post(endpoint, data = null) {
        return this.request('POST', endpoint, data);
    }

    async put(endpoint, data = null) {
        return this.request('PUT', endpoint, data);
    }

    async patch(endpoint, data = null) {
        return this.request('PATCH', endpoint, data);
    }

    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
}

const api = new API();
