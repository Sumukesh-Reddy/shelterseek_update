document.addEventListener('DOMContentLoaded', () => {
    // Retrieve the current user from sessionStorage
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!currentUser) {
        // Redirect to login page if no user is logged in
        window.location.href = 'loginweb.html';
        return;
    }

    // Populate the profile form with current user data
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

    if (nameInput && emailInput) {
        nameInput.value = currentUser.name || ''; // Set the name input value
        emailInput.value = currentUser.email || ''; // Set the email input value
    } else {
        console.error('Name or email input fields not found!');
    }

    // Handle profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Update the user's name and email
            currentUser.name = nameInput.value;
            currentUser.email = emailInput.value;

            // Save the updated user data to sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update the user's data in dataStore (localStorage)
            const users = dataStore.getUsers();
            const updatedUsers = users.map(user => {
                if (user.email === currentUser.email) {
                    return { ...user, name: currentUser.name, email: currentUser.email };
                }
                return user;
            });

            // Save the updated users back to localStorage
            localStorage.setItem('users', JSON.stringify(updatedUsers));

            alert('Profile updated successfully!');
        });
    }

    // Handle password change form submission
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (currentPassword !== currentUser.password) {
                alert('Current password is incorrect.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('New passwords do not match.');
                return;
            }

            // Update the user's password
            currentUser.password = newPassword;

            // Save the updated user data to sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update the user's data in dataStore (localStorage)
            const users = dataStore.getUsers();
            const updatedUsers = users.map(user => {
                if (user.email === currentUser.email) {
                    return { ...user, password: newPassword };
                }
                return user;
            });

            // Save the updated users back to localStorage
            localStorage.setItem('users', JSON.stringify(updatedUsers));

            alert('Password changed successfully!');
        });
    }
});