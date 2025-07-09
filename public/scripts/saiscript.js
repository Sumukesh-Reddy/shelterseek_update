document.addEventListener('DOMContentLoaded', () => {
    // Admin data (local)
    const admin_data = [
        {
            name: 'Admin1',
            email: 'admin1@ShelterSeek.com',
            password: 'admin123',
            accountType: 'admin',
            isAdmin: true,
            createdAt: new Date().toISOString()
        },
        {
            name: 'Admin2',
            email: 'admin2@ShelterSeek.com',
            password: 'admin123',
            accountType: 'admin',
            isAdmin: true,
            createdAt: new Date().toISOString()
        },
        {
            name: 'Admin3',
            email: 'admin3@ShelterSeek.com',
            password: 'admin123',
            accountType: 'admin',
            isAdmin: true,
            createdAt: new Date().toISOString()
        }
    ];

    // Get DOM elements
    const loginPage = document.getElementById('loginPage');
    const registerPage = document.getElementById('registerPage');
    const loginOptions = document.getElementById('loginOptions');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBackButton = document.getElementById('loginBackButton');
    const goToRegister = document.getElementById('goToRegister');
    const goToLogin = document.getElementById('goToLogin');
    const heroTitle = document.getElementById('heroTitle');
    const profilePhotoInput = document.getElementById('registerProfilePhoto');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    let selectedType = null;

    // Profile photo preview handler
    if (profilePhotoInput && profilePhotoPreview) {
        profilePhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePhotoPreview.src = e.target.result;
                    profilePhotoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                profilePhotoPreview.src = '';
                profilePhotoPreview.style.display = 'none';
            }
        });
    }

    // Add click handlers to login type buttons
    document.querySelectorAll('.login-button').forEach(button => {
        button.addEventListener('click', () => {
            selectedType = button.dataset.type;
            loginOptions.style.display = 'none';
            loginForm.classList.add('active');
            
            const titles = {
                traveller: 'Welcome Back, Traveler',
                host: 'Welcome Back, Host',
                admin: 'Admin Portal'
            };
            heroTitle.textContent = titles[selectedType] || 'Welcome Back';
        });
    });

    // Add back button handler
    loginBackButton.addEventListener('click', () => {
        loginOptions.style.display = 'flex';
        loginForm.classList.remove('active');
        selectedType = null;
        heroTitle.textContent = 'Welcome to ShelterSeek';
    });

    // Handle admin login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Basic validation
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            // Handle admin login separately
            if (selectedType === 'admin') {
                const admin = admin_data.find(a => a.email === email && a.password === password);
                if (!admin) throw new Error('Invalid admin credentials');
                
                sessionStorage.setItem('currentUser', JSON.stringify({
                    name: admin.name,
                    email: admin.email,
                    accountType: 'admin',
                    isAdmin: true
                }));
                window.location.href = '/admin_index';
                return;
            }

            // Handle regular user login
            const response = await fetch('/loginweb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: "signIn", 
                    email, 
                    password,
                    accountType: selectedType 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.data?.user) {
                throw new Error('Invalid server response');
            }

            const user = data.data.user;
            sessionStorage.setItem('currentUser', JSON.stringify({
                name: user.name,
                email: user.email,
                accountType: user.accountType,
                isAdmin: false,
                profilePhoto: user.profilePhoto
            }));

            // Redirect based on account type
            window.location.href = user.accountType === 'host' ? '/host_index' : '/';
            
        } catch (err) {
            alert(err.message);
            console.error('Login error:', err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    // Handle registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const accountType = document.querySelector('input[name="accountType"]:checked')?.value;
        const profilePhoto = document.getElementById('registerProfilePhoto').files[0];
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validation
        if (!name || !email || !password || !confirmPassword || !accountType) {
            alert('Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        try {
            const formData = new FormData();
            formData.append('type', 'signUp');
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('accountType', accountType);
            if (profilePhoto) {
                formData.append('profilePhoto', profilePhoto);
            }

            const response = await fetch('/loginweb', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            alert('Registration successful! Please login');
            registerForm.reset();
            profilePhotoPreview.src = '';
            profilePhotoPreview.style.display = 'none';
            goToLogin.click();
        } catch (err) {
            alert(err.message);
            console.error('Registration error:', err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    });

    // Navigation between login and register pages
    goToRegister.addEventListener('click', () => {
        loginPage.classList.add('hidden');
        registerPage.classList.remove('hidden');
        heroTitle.textContent = 'Join ShelterSeek';
        loginForm.classList.remove('active');
        loginOptions.style.display = 'flex';
        selectedType = null;
    });

    goToLogin.addEventListener('click', () => {
        registerPage.classList.add('hidden');
        loginPage.classList.remove('hidden');
        heroTitle.textContent = 'Welcome to ShelterSeek';
        registerForm.reset();
        profilePhotoPreview.src = '';
        profilePhotoPreview.style.display = 'none';
    });
});