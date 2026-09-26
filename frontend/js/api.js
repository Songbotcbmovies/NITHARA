// Use relative '/api' on Vercel, but fallback to localhost:5000 for local dev
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal && window.location.port !== '5000' 
    ? 'http://localhost:5000/api' 
    : '/api';
const BACKEND_URL = isLocal && window.location.port !== '5000' 
    ? 'http://localhost:5000' 
    : '';

class ApiService {
    static async get(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }

    static async getCategories() {
        return await this.get('/categories');
    }

    static async getFeaturedProducts() {
        return await this.get('/products/featured');
    }

    static async getNewArrivals() {
        const products = await this.get('/products');
        if (products) {
            return products.sort((a, b) => b.id - a.id).slice(0, 8);
        }
        return null;
    }
    
    static getImageUrl(path) {
        if (!path) return 'https://via.placeholder.com/600x800?text=No+Image';
        if (path.startsWith('http')) return path;
        return `${BACKEND_URL}${path}`;
    }
    
    static formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    }
}
