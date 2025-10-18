class AuthManager {
    constructor() {
        this.isLoggedIn = !!localStorage.getItem('quicktop_token');
        this.currentUser = null;
        this.init();
    }

    async init() {
        if (this.isLoggedIn) {
            await this.loadCurrentUser();
        }
    }

    async loadCurrentUser() {
        try {
            const data = await api.getCurrentUser();
            this.currentUser = data.data.user;
            this.updateUI();
        } catch (error) {
            this.logout();
        }
    }

    async login(credentials) {
        try {
            const data = await api.login(credentials);
            this.isLoggedIn = true;
            this.currentUser = data.data.user;
            this.updateUI();
            
            // Show success message
            this.showMessage('Login successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
            return data;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    async signup(userData) {
        try {
            const data = await api.signup(userData);
            this.isLoggedIn = true;
            this.currentUser = data.data.user;
            this.updateUI();
            
            this.showMessage('Account created successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
            return data;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    logout() {
        api.removeToken();
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('quicktop_user');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    updateUI() {
        // Update navigation based on auth status
        const authLinks = document.querySelectorAll('.auth-link');
        const userSections = document.querySelectorAll('.user-section');
        
        if (this.isLoggedIn && this.currentUser) {
            authLinks.forEach(link => link.style.display = 'none');
            userSections.forEach(section => section.style.display = 'block');
            
            // Update user info
            const userElements = document.querySelectorAll('.user-name, .user-email, .user-avatar');
            userElements.forEach(element => {
                if (element.classList.contains('user-name')) {
                    element.textContent = this.currentUser.name;
                }
                if (element.classList.contains('user-email')) {
                    element.textContent = this.currentUser.email;
                }
                if (element.classList.contains('user-avatar')) {
                    element.textContent = this.currentUser.name.charAt(0).toUpperCase();
                }
            });
        } else {
            authLinks.forEach(link => link.style.display = 'block');
            userSections.forEach(section => section.style.display = 'none');
        }
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    requireAuth() {
        if (!this.isLoggedIn) {
            this.showMessage('Please log in to access this page', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return false;
        }
        return true;
    }
}

// Create global instance
const auth = new AuthManager();
