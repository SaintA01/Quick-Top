class QuickTopAPI {
    constructor() {
        this.baseURL = 'https://quick-top.vercel.app/api'; // Replace with your Vercel URL
        this.token = localStorage.getItem('quicktop_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('quicktop_token', token);
    }

    // Remove token (logout)
    removeToken() {
        this.token = null;
        localStorage.removeItem('quicktop_token');
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        // Add auth token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async signup(userData) {
        return await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    // Wallet methods
    async getWalletBalance() {
        const data = await this.request('/wallet/balance');
        return data.data.balance;
    }

    async getTransactions() {
        const data = await this.request('/wallet/transactions');
        return data.data.transactions;
    }

    // Service methods
    async buyAirtime(airtimeData) {
        return await this.request('/services/airtime', {
            method: 'POST',
            body: JSON.stringify(airtimeData)
        });
    }

    async buyData(dataPlan) {
        return await this.request('/services/data', {
            method: 'POST',
            body: JSON.stringify(dataPlan)
        });
    }

    async buyCable(subscriptionData) {
        return await this.request('/services/cable', {
            method: 'POST',
            body: JSON.stringify(subscriptionData)
        });
    }

    async buyElectricity(electricityData) {
        return await this.request('/services/electricity', {
            method: 'POST',
            body: JSON.stringify(electricityData)
        });
    }
}

// Create global instance
const api = new QuickTopAPI();
