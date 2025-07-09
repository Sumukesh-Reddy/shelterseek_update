// Dashboard Manager Class for Encapsulation and Modularity
class DashboardManager {
    constructor() {
        this.state = {
            bookings: [],
            rooms: [],
            guests: [],
            newCustomers: [],
            recentActivities: [],
            notificationCount: 0,
            isInitialized: false,
            charts: {},
        };

        this.elements = {
            navLinks: document.querySelector(".nav-links"),
            menuToggle: document.querySelector(".menu-toggle"),
            profileToggle: document.getElementById("profile-toggle"),
            profileDropdown: document.getElementById("profile-dropdown"),
            notificationCount: document.querySelector(".notification-count"),
            bookingsTableBody: document.querySelector("#bookings-table tbody"),
            availabilityList: document.getElementById("availability-list"),
            guestsTableBody: document.querySelector("#guests-table tbody"),
            newCustomersList: document.getElementById("new-customers-list"),
            recentActivitiesList: document.getElementById("recent-activities-list"),
            totalBookingChart: document.getElementById("totalBookingChart"),
            roomsAvailableChart: document.getElementById("roomsAvailableChart"),
            expensesChart: document.getElementById("expensesChart"),
        };

        this.init();
    }

    // Initialize the dashboard
    init() {
        if (this.state.isInitialized) return;
        this.setupEventListeners();
        this.fetchInitialData();
        this.updateTimeAgo();
        this.state.isInitialized = true;
    }

    // Set up event listeners with delegation
    setupEventListeners() {
        document.addEventListener("DOMContentLoaded", () => {
            this.hideDropdownsOnLoad();
            this.filterBookings();
            this.renderRoomAvailability();
            this.renderGuests();
            this.initializeCharts();
            this.fetchNewCustomers();
            this.fetchRecentActivities();
        });

        // Menu toggle for mobile
        this.elements.menuToggle?.addEventListener("click", () =>
            this.elements.navLinks.classList.toggle("active")
        );

        // Profile dropdown toggle
        this.elements.profileToggle?.addEventListener("click", (e) => {
            e.preventDefault();
            this.toggleDropdown(this.elements.profileDropdown);
        });

        // Close dropdowns on outside click
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".dropdown")) {
                this.hideAllDropdowns();
            }
        });

        // Dynamic filters and search
        document
            .getElementById("search-bookings")
            ?.addEventListener("input", () => this.filterBookings());
        document
            .getElementById("availability-date")
            ?.addEventListener("change", () => this.renderRoomAvailability());
        document
            .getElementById("room-type-filter")
            ?.addEventListener("change", () => this.renderRoomAvailability());
        document
            .getElementById("search-guests")
            ?.addEventListener("input", () => this.filterGuests());
    }

    // Hide all dropdowns on page load
    hideDropdownsOnLoad() {
        document.querySelectorAll(".dropdown-menu").forEach((dropdown) =>
            dropdown.classList.remove("active")
        );
    }

    // Toggle dropdown visibility
    toggleDropdown(dropdown) {
        const isVisible = dropdown.classList.contains("active");
        document.querySelectorAll(".dropdown-menu").forEach((d) =>
            d.classList.remove("active")
        );
        if (!isVisible) dropdown.classList.add("active");
    }

    // Hide all dropdowns
    hideAllDropdowns() {
        document.querySelectorAll(".dropdown-menu").forEach((dropdown) =>
            dropdown.classList.remove("active")
        );
    }

    // Update notification count dynamically
    updateNotificationCount(count) {
        this.state.notificationCount = count;
        this.elements.notificationCount.textContent = count;
        this.elements.notificationCount.style.display = count > 0 ? "inline" : "none";
    }

    // Simulate real-time notification updates
    startNotificationSimulation() {
        setInterval(() => {
            this.updateNotificationCount(this.state.notificationCount + 1);
        }, 10000);
    }

    // Fetch initial data
    async fetchInitialData() {
        try {
            const [bookings, rooms, guests] = await Promise.all([
                this.fetchBookings(),
                this.fetchRooms(),
                this.fetchGuests(),
            ]);
            this.state.bookings = bookings;
            this.state.rooms = rooms;
            this.state.guests = guests;
            this.renderBookings(this.state.bookings);
            this.renderRoomAvailability();
            this.renderGuests(this.state.guests);
            this.startNotificationSimulation();
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            this.showError("Unable to load dashboard data. Please try again later.");
        }
    }

    // Fetch new customers dynamically
    async fetchNewCustomers() {
        try {
            const response = await fetch('/api/new-customers');
            if (!response.ok) throw new Error('Failed to fetch new customers');
            const { data } = await response.json();
            this.state.newCustomers = data;
            this.renderNewCustomers();
        } catch (error) {
            console.error('Error fetching new customers:', error.message);
            this.showError('Failed to load new customers.');
        }
    }

    // Fetch recent activities dynamically
    async fetchRecentActivities() {
        try {
            const response = await fetch('/api/recent-activities');
            if (!response.ok) throw new Error('Failed to fetch recent activities');
            const { data } = await response.json();
            this.state.recentActivities = data;
            this.renderRecentActivities();
        } catch (error) {
            console.error('Error fetching recent activities:', error.message);
            this.showError('Failed to load recent activities.');
        }
    }

    // Fetch bookings from the API
    async fetchBookings() {
        try {
            const response = await fetch('/api/bookings');
            if (!response.ok) throw new Error('Failed to fetch bookings');
            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching bookings:', error.message);
            return [];
        }
    }

    // Simulated API for rooms
    async fetchRooms() {
        return new Promise((resolve) =>
            setTimeout(() => resolve([
                { id: 1, type: "Standard", available: true },
                { id: 2, type: "Deluxe", available: false },
                { id: 3, type: "Suite", available: true },
            ]), 500)
        );
    }

    // Simulated API for guests
    async fetchGuests() {
        return new Promise((resolve) =>
            setTimeout(() => resolve([
                { id: 1, name: "John Doe", email: "john@example.com", phone: "123-456-7890" },
                { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "987-654-3210" },
                { id: 3, name: "Alice Johnson", email: "alice@example.com", phone: "555-555-5555" },
            ]), 500)
        );
    }

    // Initialize Chart.js instances
    initializeCharts() {
        if (!this.elements.totalBookingChart || !this.elements.roomsAvailableChart || !this.elements.expensesChart) {
            console.warn("One or more chart canvases not found.");
            return;
        }

        this.state.charts.totalBooking = new Chart(this.elements.totalBookingChart, {
            type: "bar",
            data: {
                labels: ["Total"],
                datasets: [{
                    label: "Bookings",
                    data: [11230],
                    backgroundColor: "rgba(26, 112, 48, 0.8)",
                    borderColor: "rgba(26, 112, 48, 1)",
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: false },
                        ticks: { precision: 0 },
                    },
                    x: { display: false },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    annotation: {
                        annotations: [{
                            type: "line",
                            yMin: 11230 * 0.9807,
                            yMax: 11230 * 0.9807,
                            borderColor: "rgba(239, 68, 68, 0.8)",
                            borderWidth: 2,
                            label: {
                                content: "↓ 1.93%",
                                enabled: true,
                                position: "end",
                            },
                        }],
                    },
                },
            },
        });

        this.state.charts.roomsAvailable = new Chart(this.elements.roomsAvailableChart, {
            type: "bar",
            data: {
                labels: ["Available", "Booked (Month)", "Booked (Week)"],
                datasets: [{
                    label: "Rooms",
                    data: [312, 913, 125],
                    backgroundColor: [
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                    ],
                    borderColor: [
                        "rgba(34, 197, 94, 1)",
                        "rgba(239, 68, 68, 1)",
                        "rgba(239, 68, 68, 1)",
                    ],
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: false },
                        ticks: { precision: 0 },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                },
            },
        });

        this.state.charts.expenses = new Chart(this.elements.expensesChart, {
            type: "bar",
            data: {
                labels: ["Total", "This Month", "This Week"],
                datasets: [{
                    label: "Expenses (USD)",
                    data: [79358.50, 3540.59, 1259.28],
                    backgroundColor: "rgba(245, 158, 11, 0.8)",
                    borderColor: "rgba(245, 158, 11, 1)",
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: false },
                        ticks: { callback: (value) => `$${value.toLocaleString()}` },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                },
            },
        });
    }

    // Render new customers
    renderNewCustomers() {
        if (!this.elements.newCustomersList) return;
        this.elements.newCustomersList.innerHTML = "";
        this.state.newCustomers.forEach(customer => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="initials">${customer.initials}</span>
                ${customer.name} <br> ${customer.email}
            `;
            this.elements.newCustomersList.appendChild(li);
        });
    }

    // Render recent activities
    renderRecentActivities() {
        if (!this.elements.recentActivitiesList) return;
        this.elements.recentActivitiesList.innerHTML = "";
        this.state.recentActivities.forEach(activity => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="initials">${activity.initials}</span>
                ${activity.name} ${activity.action}. <br>
                <span class="time-ago" data-timestamp="${activity.updatedAt.toISOString()}"></span>
            `;
            this.elements.recentActivitiesList.appendChild(li);
        });
        this.updateTimeAgo();
    }

    // Update "time ago" display
    updateTimeAgo() {
        const timeElements = document.querySelectorAll('.time-ago');
        timeElements.forEach(el => {
            const timestamp = new Date(el.dataset.timestamp);
            const now = new Date();
            const diffMs = now - timestamp;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (diffHours >= 24) {
                const diffDays = Math.floor(diffHours / 24);
                el.textContent = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else if (diffHours > 0) {
                el.textContent = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else {
                el.textContent = diffMinutes > 0 
                    ? `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
                    : 'Just now';
            }
        });
    }

    // Render bookings table
    renderBookings(bookings) {
        if (!this.elements.bookingsTableBody) return;
        this.elements.bookingsTableBody.innerHTML = "";
        bookings.forEach((booking) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.guestName}</td>
                <td>${booking.checkIn}</td>
                <td>${booking.checkOut}</td>
                <td>$${booking.amount}</td>
                <td>${booking.email}</td>
            `;
            this.elements.bookingsTableBody.appendChild(row);
        });
    }

    // Render room availability
    renderRoomAvailability() {
        if (!this.elements.availabilityList) return;
        const date = document.getElementById("availability-date")?.value || new Date().toISOString().split("T")[0];
        const roomType = document.getElementById("room-type-filter")?.value || "all";
        this.elements.availabilityList.innerHTML = "";
        const filteredRooms = this.state.rooms.filter((room) => {
            const matchesType = roomType === "all" || room.type.toLowerCase() === roomType;
            return matchesType;
        });
        filteredRooms.forEach((room) => {
            const roomCard = document.createElement("div");
            roomCard.classList.add("room-card");
            roomCard.innerHTML = `
                <h3>${room.type}</h3>
                <p>${room.available ? "Available" : "Booked"}</p>
            `;
            this.elements.availabilityList.appendChild(roomCard);
        });
    }

    // Render guests table
    renderGuests(guests) {
        if (!this.elements.guestsTableBody) return;
        this.elements.guestsTableBody.innerHTML = "";
        guests.forEach((guest) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${guest.id}</td>
                <td>${guest.name}</td>
                <td>${guest.email}</td>
                <td>${guest.phone}</td>
                <td class="actions">
                    <button class="edit" data-id="${guest.id}">Edit</button>
                    <button class="delete" data-id="${guest.id}">Delete</button>
                </td>
            `;
            this.elements.guestsTableBody.appendChild(row);
        });
        this.addTableEventListeners();
    }

    // Filter bookings dynamically
    filterBookings() {
        const searchTerm = (document.getElementById("search-bookings")?.value || "").toLowerCase();
        const filteredBookings = this.state.bookings.filter((booking) => {
            const matchesSearch =
                booking.guestName.toLowerCase().includes(searchTerm) || booking.id.toString().includes(searchTerm);
            return matchesSearch;
        });
        this.renderBookings(filteredBookings);
    }

    // Filter guests dynamically
    filterGuests() {
        const searchTerm = (document.getElementById("search-guests")?.value || "").toLowerCase();
        const filteredGuests = this.state.guests.filter((guest) =>
            guest.name.toLowerCase().includes(searchTerm)
        );
        this.renderGuests(filteredGuests);
    }

    // Add event listeners for table actions with delegation
    addTableEventListeners() {
        document.querySelectorAll("#guests-table").forEach((table) => {
            table.addEventListener("click", (e) => {
                const button = e.target.closest("button");
                if (!button) return;
                const id = button.dataset.id;
                if (button.classList.contains("edit")) this.handleEdit(id, button.closest("table").id);
                else if (button.classList.contains("delete")) this.handleDelete(id);
            });
        });
    }

    // Handle edit action for guests
    handleEdit(id, tableId) {
        const guest = this.state.guests.find((g) => g.id === id);
        if (guest) alert(`Editing guest: ${guest.name}`);
    }

    // Handle delete guest
    handleDelete(id) {
        const guest = this.state.guests.find((g) => g.id === id);
        if (guest && confirm(`Are you sure you want to delete ${guest.name}?`)) {
            this.state.guests = this.state.guests.filter((g) => g.id !== id);
            this.filterGuests();
        }
    }

    // Display error messages
    showError(message) {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = message;
        errorDiv.style.cssText = "color: #ef4444; padding: 1rem; background: #fee2e2; border-radius: 0.5rem; margin: 1rem;";
        document.body.insertBefore(errorDiv, document.body.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Cleanup charts on destroy
    destroyCharts() {
        Object.values(this.state.charts).forEach((chart) => chart.destroy());
    }
}

// Initialize the dashboard
const dashboard = new DashboardManager();