document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('Please login to view the dashboard.');
    window.location.href = '/loginweb';
    return;
  }

  document.querySelector('.nav-link.logout').addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = '/loginweb';
  });

  // Handle bookings link click
  document.querySelector('.nav-link[href="#bookings"]').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.bookings-section').classList.remove('hidden');
    document.querySelector('.earnings-section').classList.add('hidden');
    displayBookings(currentUser.email);
  });

  // Handle earnings link click
  document.querySelector('.nav-link[href="#earnings"]').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.bookings-section').classList.add('hidden');
    document.querySelector('.earnings-section').classList.remove('hidden');
    displayEarnings(currentUser.email);
  });

  // Fetch and display listings from backend API
  let hostListings = [];
  try {
    const response = await fetch('/api/listings');
    const result = await response.json();
    if (result.status === 'success') {
      hostListings = result.data.listings.filter(listing => listing.email === currentUser.email);
    }
  } catch (e) {
    console.error('Failed to fetch listings', e);
    showAlert('Failed to load listings. Please try again later.', 'error');
  }
  displayListings(hostListings);

  // Function to show alerts
  function showAlert(message, type) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.querySelector(".profile-container").insertBefore(
      alertDiv,
      document.querySelector(".profile-container").firstChild
    );
    setTimeout(() => alertDiv.remove(), 3000);
  }

  // Handle update and delete actions (event delegation)
  document.getElementById('listings-container').addEventListener('click', async (event) => {
    const target = event.target;
    const listingId = target.getAttribute('data-id');
    if (target.classList.contains('update-listing-btn')) {
      window.location.href = `/host_index?listingId=${listingId}`;
    }
    if (target.classList.contains('delete-listing-btn')) {
      if (confirm('Are you sure you want to delete this listing?')) {
        try {
          const response = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
          const result = await response.json();
          if (result.status === 'success') {
            showAlert('Listing deleted successfully!', 'success');
            target.closest('.listing-card').remove();
          } else {
            showAlert(result.message || 'Failed to delete listing.', 'error');
          }
        } catch (e) {
          showAlert('Failed to delete listing.', 'error');
        }
      }
    }
  });

  // Function to display bookings
  async function displayBookings(hostEmail) {
    try {
      const response = await fetch(`/api/bookings/host/${hostEmail}`);
      const result = await response.json();
      if (result.status === 'success') {
        const bookings = result.data.bookings;
        const monthlyBookings = processMonthlyBookings(bookings);
        renderBookingsChart(monthlyBookings);
        displayMonthlyBookingsList(monthlyBookings);
      } else {
        showAlert('Failed to load bookings.', 'error');
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
      showAlert('Failed to load bookings.', 'error');
    }
  }

  // Function to display earnings
  async function displayEarnings(hostEmail) {
    try {
      const response = await fetch(`/api/bookings/host/${hostEmail}`);
      const result = await response.json();
      if (result.status === 'success') {
        const bookings = result.data.bookings;
        const monthlyEarnings = processMonthlyEarnings(bookings);
        renderEarningsChart(monthlyEarnings);
        displayMonthlyEarningsList(monthlyEarnings);
      } else {
        showAlert('Failed to load earnings.', 'error');
      }
    } catch (e) {
      console.error('Error fetching earnings:', e);
      showAlert('Failed to load earnings.', 'error');
    }
  }

  // Process bookings by month
  function processMonthlyBookings(bookings) {
    const monthlyCounts = {};
    bookings.forEach(booking => {
      const date = new Date(booking.checkIn);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
    });
    return monthlyCounts;
  }

  // Process earnings by month
  function processMonthlyEarnings(bookings) {
    const monthlyEarnings = {};
    bookings.forEach(booking => {
      const date = new Date(booking.checkIn);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyEarnings[monthYear] = (monthlyEarnings[monthYear] || 0) + booking.amount;
    });
    return monthlyEarnings;
  }

  // Render bookings chart
  function renderBookingsChart(monthlyBookings) {
    const ctx = document.getElementById('bookingsChart').getContext('2d');
    const labels = Object.keys(monthlyBookings).sort();
    const data = labels.map(label => monthlyBookings[label]);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(label => {
          const [year, month] = label.split('-');
          return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
          label: 'Bookings per Month',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Bookings'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }

  // Render earnings chart
  function renderEarningsChart(monthlyEarnings) {
    const ctx = document.getElementById('earningsChart').getContext('2d');
    const labels = Object.keys(monthlyEarnings).sort();
    const data = labels.map(label => monthlyEarnings[label]);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(label => {
          const [year, month] = label.split('-');
          return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
          label: 'Earnings per Month',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Earnings (₹)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }

  // Display monthly bookings list
  function displayMonthlyBookingsList(monthlyBookings) {
    const list = document.getElementById('monthly-bookings-list');
    list.innerHTML = '';
    Object.entries(monthlyBookings).sort().forEach(([monthYear, count]) => {
      const [year, month] = monthYear.split('-');
      const date = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      const li = document.createElement('li');
      li.textContent = `${date}: ${count} booking${count > 1 ? 's' : ''}`;
      list.appendChild(li);
    });
  }

  // Display monthly earnings list
  function displayMonthlyEarningsList(monthlyEarnings) {
    const list = document.getElementById('monthly-earnings-list');
    list.innerHTML = '';
    Object.entries(monthlyEarnings).sort().forEach(([monthYear, amount]) => {
      const [year, month] = monthYear.split('-');
      const date = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      const li = document.createElement('li');
      li.textContent = `${date}: ₹${amount.toFixed(2)}`;
      list.appendChild(li);
    });
  }
});

// Display listings
function displayListings(listings) {
  const listingsContainer = document.getElementById('listings-container');
  if (!listingsContainer) {
    console.error("Listings container not found!");
    return;
  }
  if (listings.length === 0) {
    listingsContainer.innerHTML = "No listings found. Create your first listing!";
    return;
  }
  listingsContainer.innerHTML = listings.map(listing => `
    <div class="listing-card" data-id="${listing._id}">
      <h4>${listing.title}</h4>
      <p><strong>Description:</strong> ${listing.description}</p>
      <p><strong>Price:</strong> ₹${listing.price}</p>
      <p><strong>Location:</strong> ${listing.location}</p>
      <p><strong>Coordinates:</strong> (${listing.coordinates && listing.coordinates.lat ? listing.coordinates.lat : ''}, ${listing.coordinates && listing.coordinates.lng ? listing.coordinates.lng : ''})</p>
      <p><strong>Max Days Allowed:</strong> ${listing.maxdays}</p>
      <p><strong>Property Type:</strong> ${listing.propertyType}</p>
      <p><strong>Capacity:</strong> ${listing.capacity}</p>
      <p><strong>Room Type:</strong> ${listing.roomType}</p>
      <p><strong>Bedrooms:</strong> ${listing.bedrooms}</p>
      <p><strong>Beds:</strong> ${listing.beds}</p>
      <p><strong>Room Size:</strong> ${listing.roomSize}</p>
      <p><strong>Room Location:</strong> ${listing.roomLocation || ''}</p>
      <p><strong>Transport Distance:</strong> ${listing.transportDistance || ''}</p>
      <p><strong>Host Gender:</strong> ${listing.hostGender || ''}</p>
      <p><strong>Food Facility:</strong> ${listing.foodFacility || ''}</p>
      <p><strong>Amenities:</strong> ${listing.amenities && listing.amenities.length ? listing.amenities.join(', ') : ''}</p>
      <p><strong>Discount:</strong> ${listing.discount || ''}</p>
      <p><strong>Likes:</strong> ${listing.likes}</p>
      <p><strong>Status:</strong> ${listing.status}</p>
      <p><strong>Booking Available:</strong> ${listing.booking ? 'Yes' : 'No'}</p>
      <p><strong>Reviews:</strong> ${listing.reviews && listing.reviews.length ? listing.reviews.join(', ') : ''}</p>
      <p><strong>Created At:</strong> ${listing.createdAt ? new Date(listing.createdAt).toLocaleString() : ''}</p>
      ${listing.images && listing.images.length > 0 ? `
        <div>
          <strong>Images:</strong>
          ${listing.images.map(imgId => `<img src="/api/images/${imgId}" alt="Listing Image" style="width: 100px; height: auto; margin-right: 5px;" />`).join('')}
        </div>
      ` : ''}
      <button class="update-listing-btn" data-id="${listing._id}">Update</button>
      <button class="delete-listing-btn" data-id="${listing._id}">Delete</button>
    </div>
  `).join('');
}