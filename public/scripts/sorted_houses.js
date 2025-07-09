// Helper function to categorize room size
function categorizeSize(size) {
    const sizes = {
      'small': 'Small',
      'medium': 'Medium',
      'large': 'Large'
    };
    return sizes[size.toLowerCase()] || 'Medium';
  }
  
  // Helper function to format currency
  function formatCurrency(number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(number);
  }
  
  // Global variable to store homes data
  let updatedHomes = [];
  
  // Function to fetch rooms from API
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
  
  // Function to show error messages
  function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    document.body.prepend(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
  }
  
// Add this function near the top of sorted_houses.js
function processImagePaths(images) {
    if (!Array.isArray(images) || images.length === 0) {
        return ['/images/default-house.jpg'];
    }
    return images.map(img => {
        if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) {
            return img;
        }
        if (typeof img === 'string' && /^[0-9a-fA-F]{24}$/.test(img)) {
            return `/api/images/${img}`;
        }
        return '/images/default-house.jpg';
    });
}

// Update initializeApp to process images
async function initializeApp() {
    try {
        const rooms = await fetchRooms();
        updatedHomes = rooms.map(room => ({
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
                email: room.email || "",
                food: room.foodFacility || "",
                name: room.name || "Unknown Host",
                image: room.hostImage || "/images/logo.png",
                yearsWithUs: room.yearsWithUs || 0,
                latitude: room.coordinates?.lat || 0,
                longitude: room.coordinates?.lng || 0
            },
            maxdays: room.maxStayDays || 10,
            images: processImagePaths(room.images), // Process images here
            reviews: room.reviews || [],
            amenities: Array.isArray(room.amenities) ? room.amenities : 
                      Object.keys(room.amenities || {}).filter(key => room.amenities[key]),
            bedrooms: room.bedrooms || 0,
            beds: room.beds || 0,
            adults: room.capacity || 0,
            children: 0,
            roomType: room.roomType || "any"
        }));
        
        setupEventListeners();
    } catch (error) {
        console.error("Error in application:", error);
        showErrorMessage("Failed to initialize application. Please refresh the page.");
    }
}
  // Set up all event listeners
  function setupEventListeners() {
    const filterSearchButton = document.getElementById("filter-search-button");
    if (filterSearchButton) {
      filterSearchButton.addEventListener("click", applyFilters);
    }
  
    const searchButton = document.getElementById("search-button");
    if (searchButton) {
      searchButton.addEventListener("click", applyFilters);
    }
  }
  
  // Apply filters based on user selection (updated to match sorting.js)
  function applyFilters() {
    if (!updatedHomes || updatedHomes.length === 0) {
      console.error("No homes data available to filter");
      return;
    }
  
    const cityInput = document.getElementById("search-bar")?.value.trim().toLowerCase();
    const keywords = cityInput ? cityInput.split(",").map(keyword => keyword.trim()) : [];
  
    const minPrice = parseInt(document.querySelector(".min-input")?.value) || 0;
    const maxPrice = parseInt(document.querySelector(".max-input")?.value) || Infinity;
  
    const selectedTypes = [];
    document.querySelectorAll(".room-box.active").forEach(house => {
      selectedTypes.push(house.getAttribute("data-value"));
    });
  
    const selectedRoomType = document.querySelector('input[name="room"]:checked')?.value || "any";
    const selectedRoomLocations = [];
    document.querySelectorAll("#room-location .select-box.active").forEach(location => {
      selectedRoomLocations.push(location.getAttribute("data-value"));
    });
  
    const selectedAmenities = [];
    document.querySelectorAll("#amenities .select-box.active").forEach(amenity => {
      selectedAmenities.push(amenity.getAttribute("data-value"));
    });
  
    const noOfDays = parseInt(document.getElementById("days")?.textContent) || 0;
    const selectedBedrooms = parseInt(document.getElementById("bedrooms")?.textContent) || 0;
    const selectedBeds = parseInt(document.getElementById("beds")?.textContent) || 0;
    const selectedAdults = parseInt(document.getElementById("adults")?.textContent) || 0;
    const selectedChildren = parseInt(document.getElementById("childrens")?.textContent) || 0;
    const selectedHostGender = document.querySelector('input[name="host"]:checked')?.value || "any";
    
    const selectedFoodPreferences = [];
    document.querySelectorAll("#food-preferences .select-box.active").forEach(food => {
      selectedFoodPreferences.push(food.getAttribute("data-value"));
    });
  
    const selectedRoomSize = document.querySelector('input[name="room-size"]:checked')?.value || "any";
    const selectedTransport = document.querySelector('input[name="room-distance"]:checked')?.value || "any";
  
    const filteredHomes = updatedHomes.filter(home => {
      const homePrice = parseFloat(home.price);
  
      // Keyword matching
      const matchesKeywords = keywords.length === 0 || keywords.some(keyword => {
        return (
          home.title.toLowerCase().includes(keyword) ||
          home.location.toLowerCase().includes(keyword)
        );
      });
  
      const matchesPrice = homePrice >= minPrice && homePrice <= maxPrice;
      const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => {
        return home.title.toLowerCase().includes(type);
      });
  
      const matchesRoomType = selectedRoomType === "any" || home.roomType === selectedRoomType;
      const matchesRoomLocation = selectedRoomLocations.length === 0 || 
        selectedRoomLocations.some(location => home.locationType === location);
  
      const matchesAmenities = selectedAmenities.length === 0 || 
        selectedAmenities.every(amenity => home.amenities.includes(amenity));
  
      const matchesBedrooms = home.bedrooms >= selectedBedrooms;
      const matchesBeds = home.beds >= selectedBeds;
      const matchesAdults = home.adults >= selectedAdults;
      const matchesChildren = home.children >= selectedChildren;
      const matchesHostGender = selectedHostGender === "any" || home.host.gen === selectedHostGender;
  
      const matchesFoodPreferences = selectedFoodPreferences.length === 0 || 
        selectedFoodPreferences.every(food => home.food === food);
  
      const matchesRoomSize = selectedRoomSize === "any" || home.size === selectedRoomSize;
      const matchesTransport = selectedTransport === "any" || home.transport === selectedTransport;
      const matchesDays = !home.maxdays || home.maxdays >= noOfDays;
  
      return (
        matchesKeywords &&
        matchesPrice &&
        matchesType &&
        matchesRoomType &&
        matchesRoomLocation &&
        matchesAmenities &&
        matchesBedrooms &&
        matchesBeds &&
        matchesAdults &&
        matchesChildren &&
        matchesHostGender &&
        matchesFoodPreferences &&
        matchesRoomSize &&
        matchesTransport &&
        matchesDays
      );
    });
  
    displayHomes(filteredHomes);
  }
  
  // Display homes in the container
  function displayHomes(homes) {
    const container = document.getElementById("homes-container");
    if (!container) {
      console.error("Homes container not found");
      return;
    }
    
    container.innerHTML = ""; // Clear the container
  
    const likedHomes = JSON.parse(localStorage.getItem("likedHomes")) || [];
    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  
    if (homes.length === 0) {
      container.innerHTML = "<p class='no-results'>No houses found matching your criteria.</p>";
      return;
    }
  
    homes.forEach(home => {
      home.liked = likedHomes.includes(home.id);
      addHomeToPage(home, container, bookings);
    });
  }
  
  // Add individual home to the page
  function addHomeToPage(home, container, bookings) {
    const homeBlock = document.createElement("div");
    homeBlock.classList.add("home-block");
    homeBlock.setAttribute("data-home-id", home.id);
  
    const isBooked = bookings.some(booking => booking.homeId === home.id);
    if (isBooked) {
      homeBlock.classList.add("booked");
    }
  
    homeBlock.innerHTML = `
      <div class="home-photos-block">
        <button id="home-like" data-home-id="${home.id}">
          <i class="fa fa-heart${home.liked ? ' liked' : ''}"></i>
        </button>
        ${home.images.length > 1 ? `
          <button id="img-move-left">&lt;</button>
          <button id="img-move-right">&gt;</button>
        ` : ''}
        <div class="home-image" style="background-image: url(${home.images[0] || '/images/default-house.jpg'})"></div>
      </div>
      <hr style="opacity: 0.3;">
      <div class="home-content">
        <h3>${home.title}</h3>
        <p>Location: ${home.location}</p>
        <p class="price">${formatCurrency(home.price * (1 - home.discountPercentage / 100))}</p>
        ${home.discountPercentage > 0 ? `
          <span class="old-price">${formatCurrency(home.price)}</span>
          <p class="discount">Discount: ${home.discountPercentage}% off</p>
        ` : ''}
        <p>${home.description}</p>
      </div>
    `;
    // Add image slider functionality if multiple images
    if (home.images.length > 1) {
      const homeImage = homeBlock.querySelector(".home-image");
      const leftButton = homeBlock.querySelector("#img-move-left");
      const rightButton = homeBlock.querySelector("#img-move-right");
      let currentImageIndex = 0;
  
      function showSlide(index) {
        homeImage.style.backgroundImage = `url(${home.images[index]})`;
      }
  
      leftButton.addEventListener("click", (event) => {
        event.stopPropagation();
        currentImageIndex = (currentImageIndex === 0) ? home.images.length - 1 : currentImageIndex - 1;
        showSlide(currentImageIndex);
      });
  
      rightButton.addEventListener("click", (event) => {
        event.stopPropagation();
        currentImageIndex = (currentImageIndex === home.images.length - 1) ? 0 : currentImageIndex + 1;
        showSlide(currentImageIndex);
      });
    }
  
    // Add like button functionality
    const likeButton = homeBlock.querySelector("#home-like");
    likeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const likedHomes = JSON.parse(localStorage.getItem("likedHomes")) || [];
      const homeId = home.id;
      const icon = likeButton.querySelector("i");
      
      if (likedHomes.includes(homeId)) {
        const index = likedHomes.indexOf(homeId);
        likedHomes.splice(index, 1);
        icon.classList.remove("liked");
      } else {
        likedHomes.push(homeId);
        icon.classList.add("liked");
      }
      
      localStorage.setItem("likedHomes", JSON.stringify(likedHomes));
    });
  
    // Add click handler for viewing details
    homeBlock.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = `/room_layout?id=${home.id}`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  
    container.appendChild(homeBlock);
  }
  
  // Initialize the app when DOM is loaded
  document.addEventListener("DOMContentLoaded", initializeApp);