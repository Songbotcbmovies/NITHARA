class AdminApiService {
    static getToken() {
        return localStorage.getItem('admin_token');
    }

    static logout() {
        localStorage.removeItem('admin_token');
        window.location.href = '/pages/login.html';
    }

    static getHeaders() {
        const token = this.getToken();
        if (!token) this.logout();
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    static async get(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: this.getHeaders()
            });
            if (response.status === 401 || response.status === 403) this.logout();
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }

    static async post(endpoint, data) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            if (response.status === 401 || response.status === 403) this.logout();
            return { status: response.status, data: await response.json() };
        } catch (error) {
            console.error('API Error:', error);
            return { status: 500, data: { message: 'Network error' } };
        }
    }

    static async put(endpoint, data) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            if (response.status === 401 || response.status === 403) this.logout();
            return { status: response.status, data: await response.json() };
        } catch (error) {
            console.error('API Error:', error);
            return { status: 500, data: { message: 'Network error' } };
        }
    }

    static async delete(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (response.status === 401 || response.status === 403) this.logout();
            return { status: response.status, data: await response.json() };
        } catch (error) {
            console.error('API Error:', error);
            return { status: 500, data: { message: 'Network error' } };
        }
    }
}
