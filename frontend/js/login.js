document.addEventListener('DOMContentLoaded', () => {
    
    // If already logged in, redirect to admin
    if (localStorage.getItem('admin_token')) {
        window.location.href = '/pages/admin.html';
        return;
    }
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('error-msg');
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.access_token) {
                // Save token
                localStorage.setItem('admin_token', data.access_token);
                // Redirect
                window.location.href = '/pages/admin.html';
            } else {
                errorEl.innerText = data.message || 'Invalid credentials';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Network error. Please try again.';
            errorEl.style.display = 'block';
        }
    });
});
