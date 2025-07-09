// Utility function to show error messages
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'global-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <i class="fa fa-exclamation-circle"></i>
        <span>${message}</span>
      </div>
    `;
    document.body.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
  
  // Fetch all rooms from API
  async function fetchRooms() {
    try {
      const response = await fetch('http://localhost:3000/api/rooms');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const result = await response.json();
      if (result.status === "success" && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.error("Failed to fetch rooms:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      showErrorMessage("Failed to load listings. Please try again later.");
      return [];
    }
  }
  
  // Process image paths from API data
  function processImagePaths(images) {
    // If no images array or empty array, return default
    if (!Array.isArray(images) || images.length === 0) {
      return ['/images/photo1.jpg'];
    }
    
    return images.map(img => {
      try {
        // If already a full URL or path
        if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) {
          return img;
        }
        
        // If it's a MongoDB ObjectId
        if (typeof img === 'string' && /^[0-9a-fA-F]{24}$/.test(img)) {
          return `/api/images/${img}`;
        }
        
        // Default fallback
        return '/images/photo1.jpg';
      } catch (error) {
        console.error('Error processing image path:', error);
        return '/images/photo1.jpg';
      }
    });
  }
  // Categorize room size
  function categorizeSize(size) {
    if (typeof size === 'string') {
      const lowerSize = size.toLowerCase();
      if (["small", "medium", "large"].includes(lowerSize)) {
        return lowerSize;
      }
    }
    return "medium";
  }
  
  // Format currency
  function formatCurrency(number) {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(number);
  }
  
  // Generate star ratings HTML
  function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return `
      ${'<i class="fa fa-star"></i>'.repeat(fullStars)}
      ${halfStar ? '<i class="fa fa-star-half-o"></i>' : ''}
      ${'<i class="fa fa-star-o"></i>'.repeat(emptyStars)}
    `;
  }
  
  // Calculate average rating from reviews
  function calculateAverageRating(reviews) {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((total, rev) => total + (rev.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }
  
  // Main function to initialize the application
  async function initializeApp() {
    try {
      // 1. Fetch all rooms data
      const homes = await fetchRooms();
      console.log("Fetched rooms data:", homes);
      
      // 2. Get the room ID from URL
      const params = new URLSearchParams(window.location.search);
      const roomId = params.get("id");
      console.log("Room ID from URL:", roomId);
      
      if (!roomId) {
        console.error("No room ID specified in URL");
        document.getElementById("room-details-container").innerHTML = 
          "<p class='error'>No room specified. Please select a room from the listings.</p>";
        return;
      }
      
      // 3. Find the specific room
      const room = homes.find(h => h._id === roomId);
      console.log("Found room:", room);
      
      if (!room) {
        console.error("Room not found with ID:", roomId);
        document.getElementById("room-details-container").innerHTML = 
          "<p class='error'>Room not found. Please check the URL.</p>";
        return;
      }
      
      // 4. Process the room data
      const processedRoom = {
        id: room._id,
        title: room.title || "Untitled Property",
        location: room.location || "Location not specified",
        price: parseFloat(room.price) || 0,
        description: room.description || "",
        size: categorizeSize(room.roomSize),
        discountPercentage: room.discount || 0,
        food: room.foodFacility || "not-available",
        transport: room.transportDistance || "",
        locationType: room.roomLocation || "",
        host: {
          gen: room.hostGender || "",
          email:room.email||"",
          food: room.foodFacility || "",
          name: room.name || "Unknown Host",
          image: room.hostImage || "/images/logo.png",
          yearsWithUs: room.yearsWithUs || 0,
          latitude: room.coordinates?.lat || 0,
          longitude: room.coordinates?.lng || 0
        },
        maxdays: room.maxStayDays || 10,
        media: processImagePaths(room.images),
        review_main: room.reviews || [],
        amenities: {
          wifi: room.amenities?.includes("wifi") || false,
          ac: room.amenities?.includes("ac") || false,
          laundry: room.amenities?.includes("laundry") || false,
          hotWater: room.amenities?.includes("hotWater") || false,
          taps: room.amenities?.includes("taps") || false,
          lift: room.amenities?.includes("lift") || false,
          carParking: room.amenities?.includes("carParking") || false,
          EvCharging: room.amenities?.includes("EvCharging") || false,
          Electricity: room.amenities?.includes("Electricity") || false
        }
      };
      
      // 5. Render the room details
      renderRoomDetails(processedRoom);
      
      // 6. Initialize interactive elements
      setupInteractiveElements(processedRoom);
      
    } catch (error) {
      console.error("Error in application:", error);
      document.getElementById("room-details-container").innerHTML = 
        `<p class='error'>An error occurred: ${error.message}</p>`;
    }
  }
  
  // Render the room details HTML
  function renderRoomDetails(room) {
    const container = document.getElementById("home-details");
    if (!container) {
        console.error("Container element not found");
        return;
    }
    
    // Set page title
    document.title = `${room.title} - ${room.location}`;
    
    // Generate the HTML with updated image handling
    container.innerHTML = `
    <div class="home-name">
        <h1 style="color:#d72d6e">${room.title}</h1>
        <div class="share-button-div">
            <button id="share-button"><i class="fa fa-share-alt" aria-hidden="true"></i></button>
        </div>
    </div>
    
    ${room.media && room.media.length > 0 ? `
      <div class="main-image" style="background-image: url('${room.media[0]}');">
          <button id="prev-image"><i class="fa fa-chevron-left"></i></button>
          <button id="next-image"><i class="fa fa-chevron-right"></i></button>
      </div>
      <div class="thumbnails">
          ${room.media.map((img, index) => `
              <img src="${img}" class="thumbnail" alt="Thumbnail ${index + 1}" />
          `).join('')}
      </div>
    ` : '<p>No images available</p>'}

    
    <div class="container">
        <div class="left-side">
            <div class="layout-description">
                <h2 style="color:#d72d6e">Description</h2>
                <p>${room.description}</p>
            </div>
            
            <div class="verification">
                <h2 style="color:#d72d6e">Amenities</h2>
                <ul class="amenities-grid">
                    ${Object.entries(room.amenities).map(([amenity, available]) => `
                        <li>
                            <span class="amenity-name">${amenity.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span class="separator">:</span>
                            <span id="${amenity}-verify">${available ? 'Available' : 'Not Available'}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="room-information">
                <h2 style="color:#d72d6e">Room Information</h2>
                <ul class="amenities-grid">
                    <li>
                        <span class="amenity-name">Type of Host</span>
                        
                        <span style="color:#d72d6e">${room.host.gen ? room.host.gen.toUpperCase() : 'NOT SPECIFIED'}</span>
                    </li>
                    <li>
                        <span class="amenity-name">Food</span>
                       
                        <span style="color:#d72d6e">${room.host.food ? room.host.food.toUpperCase() : 'NOT SPECIFIED'}</span>
                    </li>
                    <li>
                        <span class="amenity-name">Room Location</span>
                
                        <span style="color:#d72d6e">${room.locationType ? room.locationType.toUpperCase() : 'NOT SPECIFIED'}</span>
                    </li>
                    <li>
                        <span class="amenity-name">Room Size</span>
                        
                        <span style="color:#d72d6e">${room.size || 'NOT SPECIFIED'}</span>
                    </li>
                    <li>
                        <span class="amenity-name">Nearest Transport</span>
                      
                        <span style="color:#d72d6e">${room.transport ? room.transport.toUpperCase() : 'NOT SPECIFIED'}</span>
                    </li>
                    <li>
                        <span class="amenity-name">Location</span>
                      
                        <span style="color:#d72d6e">${room.location ? room.location.toUpperCase() : 'NOT SPECIFIED'}</span>
                    </li>
                </ul>
            </div>
        </div>
        
        <div class="right-side">
            <div class="rent">
                <h2 style="color: #d72d6e;">Book Your Stay</h2>
                <p><strong>Cost:</strong> <span id="cost">${formatCurrency(room.price * (1 - (room.discountPercentage || 0) / 100))}</span> / night</p>
                <p><strong>Rating:</strong> <span id="rating">${calculateAverageRating(room.review_main)}</span> / 5</p>
                <div id="avg-stars">${generateStars(calculateAverageRating(room.review_main))}</div>
                <p><strong>Maximum Days:</strong><span> ${room.maxdays || 'NOT SPECIFIED'} Days</span></p>
                <label for="check-in">Check-in Date:</label>
                <input type="date" id="check-in" name="check-in">
                <label for="check-out">Check-out Date:</label>
                <input type="date" id="check-out" name="check-out">
                <button id="rent-button">Rent Now</button>
                <button id="save-button" data-home-id="${room.id}">Save</button>
            </div>
            
            <div class="host-info">
                <img src="${room.host.image || '/images/default-user.jpg'}" alt="Host Photo" class="host-image"
                     onerror="this.src='/images/default-user.jpg'">
                <div class="host-details">
                    <h3>Hosted by ${room.host.name || 'Unknown'}</h3>
                    <button id="message">Message</button>
                </div>
            </div>
        </div>
    </div>
    
    <div id="map"></div>
    
    <div class="review-main" style="margin-left: 5vw;">
        <h2 style="color:#d72d6e">Review from our Users</h2>
        ${room.review_main && room.review_main.length ? 
            room.review_main.map(review => `
                <div class="review-item">
                    <div class="review-content">
                        <img src="${review.image || '/images/default-user.jpg'}" alt="User" class="review-image"
                             onerror="this.src='/images/default-user.jpg'">
                        <div class="review-text">
                            <h4 class="review-name">${review.name || 'Anonymous'}</h4>
                            <div class="review-rating">${generateStars(review.rating)}</div>
                            <p class="review-description">${review.review || 'No review text provided'}</p>
                        </div>
                    </div>
                </div>
            `).join('') : 
            '<p class="no-reviews">No reviews yet.</p>'
        }
    </div>
`;
}
  
 
function setupInteractiveElements(room) {
    // Initialize the map
    if (room.host.latitude && room.host.longitude) {
        const map = L.map('map').setView([room.host.latitude, room.host.longitude], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ShelterSeek'
        }).addTo(map);
        
        L.marker([room.host.latitude, room.host.longitude]).addTo(map)
            .bindPopup("Your Room 🏠")
            .openPopup();
    }
    
    // Image gallery navigation
    let currentImageIndex = 0;
    const mainImage = document.querySelector('.main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    function updateGallery() {
        if (room.media.length === 0) return;
        mainImage.style.backgroundImage = `url('${room.media[currentImageIndex]}')`;
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentImageIndex);
        });
    }
    
    document.getElementById('next-image')?.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % room.media.length;
        updateGallery();
    });
    
    document.getElementById('prev-image')?.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + room.media.length) % room.media.length;
        updateGallery();
    });
    
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            currentImageIndex = index;
            updateGallery();
        });
    });
    
    // Rent Now button functionality
    const rentButton = document.getElementById('rent-button');
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');
    
    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    checkInInput?.setAttribute('min', today);
    checkOutInput?.setAttribute('min', today);
    
    function updateRentButton() {
        const checkInDate = checkInInput.value;
        const checkOutDate = checkOutInput.value;
        
        if (!checkInDate || !checkOutDate) {
            rentButton.textContent = "Select Dates";
            rentButton.disabled = true;
            return;
        }
        
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        if (days <= 0) {
            rentButton.textContent = "Invalid Dates";
            rentButton.disabled = true;
            return;
        }
        
        if (days > room.maxdays) {
            rentButton.textContent = `Max ${room.maxdays} days allowed`;
            rentButton.disabled = true;
        } else {
            const pricePerNight = parseFloat(room.price);
            const totalCost = days * pricePerNight * (1 - (room.discountPercentage || 0) / 100);
            rentButton.textContent = `Book Now for ${formatCurrency(totalCost)}`;
            rentButton.disabled = false;
        }
    }
    
    // Update check-out min date when check-in changes
    checkInInput?.addEventListener('change', (e) => {
        if (e.target.value) {
            checkOutInput.min = e.target.value;
        }
        updateRentButton();
    });
    
    checkOutInput?.addEventListener('change', updateRentButton);
    
    // Set initial state
    updateRentButton();
    
    // Handle rent button click
    rentButton?.addEventListener('click', () => {
        const checkInDate = checkInInput.value;
        const checkOutDate = checkOutInput.value;
        
        if (!checkInDate || !checkOutDate) {
            showErrorMessage("Please select both check-in and check-out dates");
            return;
        }
        
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        if (days > room.maxdays) {
            showErrorMessage(`Maximum stay is ${room.maxdays} days`);
            return;
        }
        const pricePerNight = parseFloat(room.price);
        const totalCost = days * pricePerNight * (1 - (room.discountPercentage || 0) / 100);
        window.location.href = `/payment?id=${room.id}&checkIn=${checkInDate}&checkOut=${checkOutDate}&cost=${totalCost}&mail=${room.host.email}`;
    });
    
    // Wishlist functionality
    let likedHomes = JSON.parse(localStorage.getItem("likedHomes") || "[]");
    console.log(likedHomes);
    const saveButton = document.getElementById('save-button');
    
    if (saveButton) {
        const isLiked = likedHomes.includes(room.id);
        saveButton.classList.toggle('liked', isLiked);
        saveButton.innerHTML = isLiked 
            ? '<i class="fa fa-heart"></i> Remove from Wishlist' 
            : '<i class="fa fa-heart"></i> Save to Wishlist';
        
        saveButton.addEventListener('click', () => {
            const isLiked = likedHomes.includes(room.id);
            
            if (isLiked) {
                likedHomes = likedHomes.filter(id => id !== room.id);
                saveButton.innerHTML = '<i class="fa fa-heart"></i> Save to Wishlist';
            } else {
                likedHomes.push(room.id);
                saveButton.innerHTML = '<i class="fa fa-heart"></i> Remove from Wishlist';
            }
            
            saveButton.classList.toggle('liked', !isLiked);
            localStorage.setItem("likedHomes", JSON.stringify(likedHomes));
        });
    }
    
    // Share button
    document.getElementById('share-button')?.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: room.title,
                text: `Check out this ${room.size} room in ${room.location}`,
                url: window.location.href
            }).catch(err => {
                console.error('Error sharing:', err);
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const shareUrl = `${window.location.origin}/room_layout?id=${room.id}`;
            prompt("Copy this link to share:", shareUrl);
        }
    });
    
    // Contact host button
    document.getElementById('message')?.addEventListener('click', () => {
        window.location.href = `/message?hostId=${room.host.name}`;
    });
}
document.addEventListener("DOMContentLoaded", initializeApp);