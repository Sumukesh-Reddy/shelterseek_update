document.addEventListener('DOMContentLoaded', async () => {
    // Utility function to format currency
    function formatCurrency(number) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(number);
    }

    // Function to save bookings to local storage
    function saveBookings(bookings) {
        localStorage.setItem("bookings", JSON.stringify(bookings));
    }

    // Function to show error messages
    function showError(message) {
        const existingError = document.querySelector('.global-error');
        if (existingError) {
            existingError.remove();
        }

        const errorElement = document.createElement('div');
        errorElement.className = 'global-error';
        errorElement.innerHTML = `
            <div class="error-content">
                <i class="fa fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(errorElement);

        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    // Function to validate email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Fetch home details (try single room first, fallback to all rooms)
    async function fetchHome(roomId) {
        try {
            // Try fetching single room
            const response = await fetch(`http://localhost:${port}/api/rooms/${roomId}`);
            if (!response.ok) throw new Error(`Failed to fetch home: ${response.status}`);
            const result = await response.json();
            return result.status === "success" ? result.data : null;
        } catch (error) {
            console.error("Error fetching single home:", error);
            // Fallback: fetch all rooms and find the matching one
            try {
                const response = await fetch(`http://localhost:${port}/api/rooms`);
                if (!response.ok) throw new Error(`Failed to fetch homes: ${response.status}`);
                const result = await response.json();
                if (result.status === "success" && Array.isArray(result.data)) {
                    return result.data.find(h => h._id === roomId) || null;
                }
                return null;
            } catch (fallbackError) {
                console.error("Error fetching all homes:", fallbackError);
                showError("Failed to load home details. Please proceed with booking or try again.");
                return null;
            }
        }
    }

    // Extract URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    const checkIn = urlParams.get('checkIn');
    const checkOut = urlParams.get('checkOut');
    const cost = parseFloat(urlParams.get('cost')); // Convert to number
    const hostMail = urlParams.get('mail');

    // Validate URL parameters
    if (!roomId || !checkIn || !checkOut || isNaN(cost)) {
        document.querySelector('.booking-details').innerHTML = "<p>Error: Invalid booking details provided.</p>";
        showError("Invalid booking details. Please try booking again.");
        return;
    }

    // Display booking details
    const home = await fetchHome(roomId);
    const bookingDetails = document.querySelector('.booking-details');
    if (home) {
        bookingDetails.innerHTML = `
            <h2>Booking Details</h2>
            <p><strong>Property:</strong> ${home.title || 'Untitled Property'}</p>
            <p><strong>Location:</strong> ${home.location || 'Unknown'}</p>
            <p><strong>Check-In:</strong> ${checkIn}</p>
            <p><strong>Check-Out:</strong> ${checkOut}</p>
            <p><strong>Total Cost:</strong> ${formatCurrency(cost)}</p>
        `;
    } else {
        // Fallback display without home details
        bookingDetails.innerHTML = `
            <h2>Booking Details</h2>
            <p><strong>Property:</strong> Room ID: ${roomId}</p>
            <p><strong>Check-In:</strong> ${checkIn}</p>
            <p><strong>Check-Out:</strong> ${checkOut}</p>
            <p><strong>Total Cost:</strong> ${formatCurrency(cost)}</p>
            <p><strong>Host Email:</strong> ${hostMail || 'Not provided'}</p>
            <p><em>Property details unavailable. You can still proceed with the booking.</em></p>
        `;
    }

    // Handle form submission
    const paymentForm = document.getElementById('payment-form');
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const userEmail = document.getElementById('user-email').value.trim();
        const userName = document.getElementById('user-name').value.trim();
        const cardNumber = document.getElementById('card-number').value.trim();

        // Get mainUserEmail from sessionStorage
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const mainUserEmail = currentUser ? currentUser.email : '';

        // Validation
        if (!userEmail || !userName || !cardNumber || !mainUserEmail) {
            showError('Please fill in all fields and ensure you are logged in');
            return;
        }

        if (!validateEmail(userEmail)) {
            showError('Please enter a valid email address');
            return;
        }

        // Validate card number (basic check for 16 digits)
        const cardRegex = /^\d{16}$/;
        if (!cardRegex.test(cardNumber.replace(/\s/g, ''))) {
            showError('Please enter a valid 16-digit card number');
            return;
        }

        const paymentButton = document.getElementById('complete-payment');
        paymentButton.disabled = true;
        paymentButton.textContent = 'Processing...';

        try {
            // Send payment data to backend
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomId: roomId,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    userEmail: userEmail,
                    userName: userName,
                    mainUserEmail: mainUserEmail,
                    hostMail: hostMail,
                    cost: cost
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                // Create booking object
                const booking = {
                    id: Date.now().toString(), // Unique ID
                    roomId: roomId,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    paymentDate: new Date().toISOString().split('T')[0],
                    totalCost: cost,
                    userName: userName,
                    userEmail: userEmail
                };

                // Save booking to local storage
                let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
                bookings.push(booking);
                saveBookings(bookings);

                showError('Payment successful! Redirecting to booking history...');
                setTimeout(() => {
                    window.location.href = '/history';
                }, 2000);
            } else {
                throw new Error(data.message || 'Payment processing failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            showError('Payment processing failed. Please try again.');
            paymentButton.disabled = false;
            paymentButton.textContent = 'Complete Payment';
        }
    });
});