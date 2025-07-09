export let likedHomes = JSON.parse(localStorage.getItem("likedHomes")) || [];

document.addEventListener("DOMContentLoaded", async function () {
  // --- Login/Logout Button Logic ---
  const loginLogoutText = document.getElementById("login-button");
  function checkLoginStatus() {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    loginLogoutText.textContent = currentUser ? "Logout" : "Login";
  }
  checkLoginStatus();
  if (loginLogoutText.textContent === "Login") {
    window.addEventListener("click", () => {
      window.location.href = '/loginweb';
    });
  }

  // --- User Menu Logic ---
  document.getElementById("user-button").addEventListener("click", () => {
    const user_menu = document.getElementById("user-menu");
    user_menu.style.display = user_menu.style.display === "block" ? "none" : "block";
  });
  document.getElementById("user-close-btn").addEventListener("click", () => {
    document.getElementById("user-menu").style.display = "none";
  });

  // --- Main Menu Logic ---
  document.getElementById("menubotton").addEventListener("click", () => {
    const menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });
  document.getElementById("close-btn").addEventListener("click", () => {
    document.getElementById("menu").style.display = "none";
  });

  // --- Sliding Photo Banner ---
  const photo = ["/images/photo1.jpg", "/images/photo2.jpg", "/images/photo3.jpg", "/images/photo4.jpg"];
  const photoblock = document.querySelector(".slide-2");
  if (photoblock) {
    let i = 0;
    function updateBackgroundImage() {
      photoblock.style.backgroundImage = `url(${photo[i]})`;
    }
    updateBackgroundImage();
    setInterval(() => {
      i = (i + 1) % photo.length;
      updateBackgroundImage();
    }, 3000);
  }

  // --- Filter Menu Toggle ---
  document.getElementById("filter-button").addEventListener("click", () => {
    const filter_menu = document.querySelector(".filter-menu");
    filter_menu.style.display = filter_menu.style.display === "none" ? "flex" : "none";
  });

  // --- Counter Logic (Bedrooms, Beds, Days, Adults, Childrens) ---
  function setupCounter(id, min, max, initial) {
    let value = initial;
    document.getElementById(`sub-${id}`).addEventListener("click", () => {
      if (value > min) {
        value--;
        document.getElementById(id).innerText = value;
      }
    });
    document.getElementById(`add-${id}`).addEventListener("click", () => {
      if (value < max) {
        value++;
        document.getElementById(id).innerText = value;
      }
    });
  }
  setupCounter("bedroom", 1, 9, 1);
  setupCounter("beds", 1, 9, 1);
  setupCounter("days", 0, 30, 1);
  setupCounter("adults", 0, 9, 1);
  setupCounter("childrens", 0, 9, 1);

  // --- Global Click Handler for Menus ---
  window.addEventListener("click", (event) => {
    const userMenu = document.getElementById("user-menu");
    const menu = document.getElementById("menu");
    const filterMenu = document.querySelector(".filter-menu");
    if (!userMenu.contains(event.target) && !document.getElementById("user-button").contains(event.target)) {
      userMenu.style.display = "none";
    }
    if (!menu.contains(event.target) && !document.getElementById("menubotton").contains(event.target)) {
      menu.style.display = "none";
    }
    if (!filterMenu.contains(event.target) && !document.getElementById("filter-button").contains(event.target)) {
      filterMenu.style.display = "none";
    }
  });

  // --- Filter Search and Close Buttons ---
  document.getElementById("filter-search-button").addEventListener("click", () => {
    document.querySelector(".filter-menu").style.display = "none";

  });
  document.getElementById("filter-close-button").addEventListener("click", () => {
    document.querySelector(".filter-menu").style.display = "none";
  });

  // --- Room Type Selection ---
  let selectedRooms = [];
  document.querySelectorAll('.room-box').forEach(box => {
    box.addEventListener('click', function () {
      let roomType = this.getAttribute('data-value');
      if (selectedRooms.includes(roomType)) {
        selectedRooms = selectedRooms.filter(item => item !== roomType);
        this.classList.remove('active');
      } else {
        selectedRooms.push(roomType);
        this.classList.add('active');
      }
      document.getElementById('selected-room-types').value = selectedRooms.join(',');
    });
  });

  // --- Radio Groups (Room Distance, Size, Host Gender) ---
  document.querySelectorAll('.radio-group').forEach(group => {
    group.addEventListener('click', function (event) {
      if (event.target.classList.contains('radio-option')) {
        group.querySelectorAll('.radio-option').forEach(label => label.classList.remove('active'));
        event.target.classList.add('active');
        const input = event.target.querySelector('input[type="radio"]');
        if (input) input.checked = true;
      }
    });
    const checkedInput = group.querySelector('input[type="radio"]:checked');
    if (checkedInput) checkedInput.parentElement.classList.add('active');
  });

  // --- Multi-Select (Amenities, Food Preferences) ---
  document.querySelectorAll('.multi-select').forEach(multiSelect => {
    const hiddenInput = multiSelect.nextElementSibling;
    const selectBoxes = multiSelect.querySelectorAll('.select-box');
    let selectedValues = [];
    selectBoxes.forEach(box => {
      box.addEventListener('click', function () {
        const value = this.getAttribute('data-value');
        if (selectedValues.includes(value)) {
          selectedValues = selectedValues.filter(item => item !== value);
          this.classList.remove('active');
        } else {
          selectedValues.push(value);
          this.classList.add('active');
        }
        hiddenInput.value = selectedValues.join(',');
      });
    });
  });

  // --- Location Type Multi-Select ---
  let selectedLocations = [];
  document.querySelectorAll('#room-location .select-box').forEach(box => {
    box.addEventListener('click', function () {
      let location = this.getAttribute('data-value');
      if (selectedLocations.includes(location)) {
        selectedLocations = selectedLocations.filter(item => item !== location);
        this.classList.remove('active');
      } else {
        selectedLocations.push(location);
        this.classList.add('active');
      }
      document.getElementById('selected-room-location').value = selectedLocations.join(',');
    });
  });

  // --- Price Range Slider ---
  window.onload = function () {
    loadStoredValues();
    updateSlider();
  };
  const minVal = document.querySelector(".min-input");
  const maxVal = document.querySelector(".max-input");
  const range = document.querySelector(".range-selected");
  const priceInputMin = document.querySelector(".min-price");
  const priceInputMax = document.querySelector(".max-price");
  const sliderMinValue = parseInt(minVal.min);
  const sliderMaxValue = parseInt(maxVal.max);
  const minGap = 1500;

  function loadStoredValues() {
    const storedMin = localStorage.getItem("priceMin");
    const storedMax = localStorage.getItem("priceMax");
    if (storedMin) minVal.value = storedMin;
    if (storedMax) maxVal.value = storedMax;
    priceInputMin.value = minVal.value;
    priceInputMax.value = maxVal.value;
  }
  function updateSlider() {
    let minValue = parseInt(minVal.value);
    let maxValue = parseInt(maxVal.value);
    if (maxValue - minValue < minGap) {
      if (event.target === minVal) {
        minVal.value = maxValue - minGap;
      } else {
        maxVal.value = minValue + minGap;
      }
    }
    let minPercent = ((minVal.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100;
    let maxPercent = ((maxVal.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100;
    range.style.left = minPercent + "%";
    range.style.right = (100 - maxPercent) + "%";
    priceInputMin.value = minVal.value;
    priceInputMax.value = maxVal.value;
    localStorage.setItem("priceMin", minVal.value);
    localStorage.setItem("priceMax", maxVal.value);
  }
  minVal.addEventListener("input", updateSlider);
  maxVal.addEventListener("input", updateSlider);
  priceInputMin.addEventListener("input", function () {
    minVal.value = this.value;
    updateSlider();
  });
  priceInputMax.addEventListener("input", function () {
    maxVal.value = this.value;
    updateSlider();
  });
});
// Initialize the map (centered on a default location, e.g., Chennai)
const map = L.map('map').setView([13.0827, 80.2707], 10);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Fetch rooms and add markers
fetch('/api/rooms')
  .then(res => res.json())
  .then(result => {
    if (result.status === "success" && Array.isArray(result.data)) {
      const rooms = result.data;
      let bounds = [];
      rooms.forEach(room => {
        // Check if coordinates exist and are valid
        if (room.coordinates && typeof room.coordinates.lat === "number" && typeof room.coordinates.lng === "number") {
          const marker = L.marker([room.coordinates.lat, room.coordinates.lng]).addTo(map);
          marker.bindPopup(`
            <strong>${room.title}</strong><br>
            ${room.description}<br>
            <em>Price: ₹${room.price}</em>
          `);
          bounds.push([room.coordinates.lat, room.coordinates.lng]);
        }
      });
      // Fit map to markers if any
      if (bounds.length) {
        map.fitBounds(bounds, {padding: [40, 40]});
      }
    } else {
      console.error("No room data found for map.");
    }
  })
  .catch(err => {
    console.error("Error loading map data:", err);
  });

