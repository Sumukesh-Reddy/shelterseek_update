// Utility function to format currency
function formatCurrency(number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(number);
}

// Function to save bookings to local storage
function saveBookings(bookings) {
    localStorage.setItem("bookings", JSON.stringify(bookings));
}

// Function to remove a booking by ID
function removeBooking(bookingId) {
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    bookings = bookings.filter(booking => booking.id !== bookingId);
    saveBookings(bookings);
    return bookings;
}

// Function to fetch homes
async function fetchHomes() {
    try {
        const response = await fetch(`http://localhost:${port}/api/rooms`);
        if (!response.ok) throw new Error(`Failed to fetch homes: ${response.status}`);
        const result = await response.json();
        return result.status === "success" ? result.data : [];
    } catch (error) {
        console.error("Error fetching homes:", error);
        return [];
    }
}

// Function to process image paths (aligned with sumukesh_layout.js)
function processImagePaths(images) {
    if (!Array.isArray(images) || images.length === 0) {
        return ['/images/photo1.jpg'];
    }
    return images.map(img => {
        try {
            if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) {
                return img;
            }
            if (typeof img === 'string' && /^[0-9a-fA-F]{24}$/.test(img)) {
                return `/api/images/${img}`;
            }
            return '/images/photo1.jpg';
        } catch (error) {
            console.error('Error processing image path:', error);
            return '/images/photo1.jpg';
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve bookings from local storage
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const bookingsContainer = document.getElementById("bookings-container");

    // Fetch homes data
    const homes = await fetchHomes();
    console.log("Bookings:", bookings);
    console.log("Homes:", homes);

    // Function to render bookings
    function renderBookings(bookings) {
        bookingsContainer.innerHTML = ""; // Clear existing content

        if (bookings.length === 0) {
            bookingsContainer.innerHTML = "<p>No bookings found.</p>";
            return;
        }

        bookings.forEach(booking => {
            const home = homes.find(h => h._id === booking.roomId); // Changed from homeId to roomId
            if (!home) {
                console.error(`Home with ID ${booking.roomId} not found.`);
                return;
            }

            // Process home data to match sumukesh_layout.js structure
            const processedHome = {
                title: home.title || "Untitled Property",
                location: home.location || "Unknown",
                price: parseFloat(home.price) || 0,
                discount: home.discount || 0,
                description: home.description || "No description available",
                images: processImagePaths(home.images)
            };

            const bookingElement = document.createElement("div");
            bookingElement.classList.add("booking");
            bookingElement.innerHTML = `
                <div class="home-block">
                    <div class="home-photos-block">
                        <div class="home-image" style="background-image: url(${processedHome.images[0]})"></div>
                    </div>
                    <hr style="opacity: 0.3;">
                    <div class="home-content">
                        <h3>${processedHome.title}</h3>
                        <p>Location: ${processedHome.location}</p>
                        <p class="price">${formatCurrency(processedHome.price * (1 - processedHome.discount / 100))}</p>
                        <span class="old-price">${formatCurrency(processedHome.price)}</span>
                        <p style="color: green; font-weight: bold;">Discount: ${processedHome.discount}% off</p>
                        <p>Description: ${processedHome.description}</p>
                    </div>
                </div>
                <p><strong>Check-In:</strong> ${booking.checkIn}</p>
                <p><strong>Check-Out:</strong> ${booking.checkOut}</p>
                <p><strong>Payment Date:</strong> ${booking.paymentDate}</p>
                <p><strong>Total Cost:</strong> ${formatCurrency(parseFloat(booking.totalCost))}</p>
                <p><strong>Booked by:</strong> ${booking.userName} (${booking.userEmail})</p>
               
                <hr>
            `;

            bookingsContainer.appendChild(bookingElement);
        });

        // Add event listeners for remove buttons
        document.querySelectorAll(".remove-booking").forEach(button => {
            button.addEventListener("click", (e) => {
                const bookingId = e.target.getAttribute("data-booking-id");
                bookings = removeBooking(bookingId);
                renderBookings(bookings);
            });
        });
    }

    // Initial render of bookings
    renderBookings(bookings);

    // Add event listener for Home button
    document.getElementById('history-home').addEventListener("click", () => {
        console.log("Home button clicked");
        window.location.href = '/';
    });

    // Add event listener for Clear History button
    const clearHistoryButton = document.getElementById('clear-history');
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener("click", () => {
            saveBookings([]);
            bookings = [];
            renderBookings(bookings);
        });
    }

    console.log("history.js loaded");
});