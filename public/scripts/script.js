document.addEventListener("DOMContentLoaded", async () => {
  // Discount slider
  const discountRange = document.getElementById("discount");
  const discountValue = document.getElementById("discount-value");
  if (discountRange && discountValue) {
    discountRange.addEventListener("input", (e) => {
      discountValue.textContent = `${e.target.value}%`;
    });
  }

  // Login/logout button behavior
  const loginLogoutText = document.getElementById("login-button");
  function checkLoginStatus() {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser) {
      loginLogoutText.textContent = "Logout";
      loginLogoutText.addEventListener("click", () => {
        sessionStorage.removeItem("currentUser");
        window.location.href = "/";
      });
    } else {
      loginLogoutText.textContent = "Login";
      loginLogoutText.addEventListener("click", () => {
        window.location.href = "/loginweb";
      });
    }
  }
  checkLoginStatus();

  // Toggle filter sections
  document.querySelectorAll(".filter-toggle").forEach((btn) => {
    const targetId = btn.getAttribute("data-target");
    if (targetId) {
      btn.addEventListener("click", () => {
        const target = document.getElementById(targetId);
        if (target) {
          target.style.display = target.style.display === "block" ? "none" : "block";
        }
      });
    }
  });

  // Sliding image background
  const photoArray = [
    "/images/photo1.jpg",
    "/images/photo2.jpg",
    "/images/photo3.jpg",
    "/images/photo4.jpg"
  ];
  const photoBlock = document.querySelector(".slide-2");
  let currentIndex = 0;
  function updateBackgroundImage() {
    if (photoBlock) {
      photoBlock.style.backgroundImage = `url(${photoArray[currentIndex]})`;
    }
  }
  updateBackgroundImage();
  setInterval(() => {
    currentIndex = (currentIndex + 1) % photoArray.length;
    updateBackgroundImage();
  }, 3000);

  // Map functionality
  let map, marker;
  if (typeof L !== "undefined" && document.getElementById("map")) {
    map = L.map("map").setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);
    marker = null;
    map.on("click", function (e) {
      const lat = e.latlng.lat.toFixed(5);
      const lng = e.latlng.lng.toFixed(5);
      document.getElementById("latitude").value = lat;
      document.getElementById("longitude").value = lng;
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }
    });
    // Automatically locate current position
    function getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            document.getElementById("latitude").value = lat;
            document.getElementById("longitude").value = lng;
            map.setView([lat, lng], 13);
            if (marker) {
              marker.setLatLng([lat, lng]);
            } else {
              marker = L.marker([lat, lng]).addTo(map);
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            alert("Unable to get location. Please enter it manually.");
          }
        );
      }
    }
    getLocation();
  }

  // Media upload preview
  const mediaInput = document.getElementById("media");
  const mediaPreview = document.getElementById("media-preview");
  const uploadContainer = document.querySelector(".upload-container");
  let selectedMedia = [];
  let removedImageIds = []; // Track removed old image IDs

  function handleMediaUpload(files) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewItem = document.createElement("div");
        previewItem.className = "preview-item";
        if (file.type.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.className = "preview-image";
          img.alt = "Preview";
          previewItem.appendChild(img);
        } else if (file.type.startsWith("video/")) {
          const video = document.createElement("video");
          video.src = e.target.result;
          video.controls = true;
          video.className = "preview-video";
          previewItem.appendChild(video);
        }
        const removeButton = document.createElement("button");
        removeButton.className = "remove-image";
        removeButton.innerHTML = "×";
        removeButton.onclick = () => {
          previewItem.remove();
          selectedMedia = selectedMedia.filter((item) => item.url !== e.target.result);
          const dataTransfer = new DataTransfer();
          selectedMedia.forEach(item => {
            dataTransfer.items.add(item.file);
          });
          mediaInput.files = dataTransfer.files;
        };
        previewItem.appendChild(removeButton);
        mediaPreview.appendChild(previewItem);
        selectedMedia.push({ file, url: e.target.result });
      };
      reader.readAsDataURL(file);
    });
  }
  if (mediaInput) {
    mediaInput.addEventListener("change", (e) => {
      handleMediaUpload(e.target.files);
    });
  }
  if (uploadContainer) {
    uploadContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadContainer.classList.add("dragover");
    });
    uploadContainer.addEventListener("dragleave", () => {
      uploadContainer.classList.remove("dragover");
    });
    uploadContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadContainer.classList.remove("dragover");
      handleMediaUpload(e.dataTransfer.files);
    });
  }

  // ----------- UPDATE/EDIT MODE SUPPORT -----------
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('listingId');
  if (listingId) {
    try {
      const response = await fetch(`/api/listings/${listingId}`);
      const result = await response.json();
      if (result.status === 'success') {
        const listing = result.data.listing;
        // Populate all relevant form fields
        document.getElementById('title').value = listing.title || '';
        document.getElementById('description').value = listing.description || '';
        document.getElementById('price').value = listing.price || '';
        document.getElementById('location').value = listing.location || '';
        document.getElementById('latitude').value = listing.coordinates?.lat || '';
        document.getElementById('longitude').value = listing.coordinates?.lng || '';
        document.getElementById('maxdays').value = listing.maxdays || '';

        document.getElementById('propertyType').value = listing.propertyType || '';
        document.getElementById('capacity').value = listing.capacity || '';
        document.getElementById('bedrooms').value = listing.bedrooms || '';
        document.getElementById('beds').value = listing.beds || '';
        document.getElementById('roomSize').value = listing.roomSize || '';
        if (listing.roomLocation) {
          const roomLocationRadio = document.querySelector(
            `input[name="roomLocation"][value="${listing.roomLocation}"]`
          );
          if (roomLocationRadio) roomLocationRadio.checked = true;
        }
        if (listing.transportDistance) {
          const transportRadio = document.querySelector(
            `input[name="transportDistance"][value="${listing.transportDistance}"]`
          );
          if (transportRadio) transportRadio.checked = true;
        }
        document.getElementById('discount').value = listing.discount || 0;
        if (discountValue) discountValue.textContent = `${listing.discount || 0}%`;

        // --- Auto-fill radio buttons ---
        // Host Gender
        if (listing.hostGender) {
          const radio = document.querySelector(`input[name="hostGender"][value="${listing.hostGender}"]`);
          if (radio) radio.checked = true;
        }
        // Food Facility
        if (listing.foodFacility) {
          const radio = document.querySelector(`input[name="foodFacility"][value="${listing.foodFacility}"]`);
          if (radio) radio.checked = true;
        }
        // Room Type
        if (listing.roomType) {
          const radio = document.querySelector(`input[name="roomType"][value="${listing.roomType}"]`);
          if (radio) radio.checked = true;
        }

        // Amenities (checkboxes)
if (Array.isArray(listing.amenities)) {
  listing.amenities.forEach(amenity => {
    const checkbox = document.querySelector(`input[name="amenities"][value="${amenity}"]`);
    if (checkbox) checkbox.checked = true;
  });
}


      

        // --- Existing images with remove button ---
        if (listing.images && listing.images.length > 0) {
          mediaPreview.innerHTML = '';
          listing.images.forEach(imageId => {
            const img = document.createElement('img');
            img.src = `/api/images/${imageId}`;
            img.className = 'preview-image';
            img.alt = 'Existing image';
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.appendChild(img);

            const existingBadge = document.createElement('span');
            existingBadge.className = 'existing-badge';
            existingBadge.textContent = 'Existing Image';
            previewItem.appendChild(existingBadge);

            // Remove button for old images
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-image';
            removeButton.innerHTML = '×';
            removeButton.onclick = () => {
              previewItem.remove();
              removedImageIds.push(imageId);
            };
            previewItem.appendChild(removeButton);

            mediaPreview.appendChild(previewItem);
          });
        }
      }
    } catch (err) {
      alert('Failed to load listing for editing');
      console.error(err);
    }
  }

  // ----------- FORM SUBMISSION (CREATE/UPDATE) -----------
  const form = document.getElementById("listing-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (!currentUser || currentUser.accountType !== 'host') {
        alert('Only hosts can submit listings. Please login as a host.');
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = listingId ? 'Updating...' : 'Submitting...';
      try {
        const formData = new FormData(form);
        formData.append('latitude', document.getElementById('latitude').value);
        formData.append('longitude', document.getElementById('longitude').value);
        formData.append('currentUser', JSON.stringify(currentUser));
        // Amenities: collect checked values
        const amenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value);
        formData.set('amenities', amenities.join(','));
        // Removed images: send to backend
        if (removedImageIds.length > 0) {
          formData.append('removedImages', removedImageIds.join(','));
        }
        let response, data;
        if (listingId) {
          response = await fetch(`/api/listings/${listingId}`, {
            method: 'PUT',
            body: formData
          });
        } else {
          response = await fetch('/api/listings', {
            method: 'POST',
            body: formData
          });
        }
        data = await response.json();
        if (!response.ok || data.status !== 'success') {
          throw new Error(data.message || 'Listing submission failed');
        }
        alert(listingId ? "Listing updated successfully!" : "Listing submitted successfully! It will be visible after admin verification.");
        window.location.href = "/dashboard";
      } catch (err) {
        alert(err.message);
        console.error('Listing submission error:', err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = listingId ? 'Update Listing' : 'Submit Listing';
      }
    });
  }

  // User menu toggle
  const userButton = document.getElementById("user-button");
  const userMenu = document.getElementById("user-menu");
  const closeBtn = document.getElementById("user-close-btn");
  if (userButton && userMenu && closeBtn) {
    userButton.addEventListener("click", () => {
      userMenu.style.display = "block";
    });
    closeBtn.addEventListener("click", () => {
      userMenu.style.display = "none";
    });
  }

  // (Optional) Load and display verified listings for public page
  async function loadVerifiedListings() {
    try {
      const response = await fetch('/api/listings');
      const data = await response.json();
      if (response.ok) {
        const verifiedListings = data.data.listings.filter(
          listing => listing.status === 'verified'
        );
        displayListings(verifiedListings);
      } else {
        console.error('Failed to load listings:', data.message);
      }
    } catch (err) {
      console.error('Error loading listings:', err);
    }
  }
  function displayListings(listings) {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) return;
    listingsContainer.innerHTML = '';
    listings.forEach(listing => {
      const listingElement = document.createElement('div');
      listingElement.className = 'listing-card';
      const imageUrl = listing.images && listing.images.length > 0 ? `/api/images/${listing.images[0]}` : '/images/default-house.jpg';
      listingElement.innerHTML = `
        <img src="${imageUrl}" alt="Listing Image" class="listing-img" />
        <div class="listing-info">
          <h4>${listing.title}</h4>
          <p><strong>Location:</strong> ${listing.location}</p>
          <p><strong>Price:</strong> ₹${listing.price} per night</p>
          <p><strong>Bedrooms:</strong> ${listing.bedrooms} · <strong>Beds:</strong> ${listing.beds}</p>
          <p><strong>Property Type:</strong> ${listing.propertyType}</p>
          <p><strong>Capacity:</strong> ${listing.capacity}</p>
          <p><strong>Room Size:</strong> ${listing.roomSize}</p>
          <p><strong>Room Location:</strong> ${listing.roomLocation || ''}</p>
          <p><strong>Transport Distance:</strong> ${listing.transportDistance || ''}</p>
          <p><strong>Host Gender:</strong> ${listing.hostGender || ''}</p>
          <p><strong>Food Facility:</strong> ${listing.foodFacility || ''}</p>
          <p><strong>Amenities:</strong> ${listing.amenities && listing.amenities.length ? listing.amenities.join(', ') : ''}</p>
          <p><strong>Discount:</strong> ${listing.discount || 0}%</p>
          <p><strong>Status:</strong> ${listing.status}</p>
          <p><strong>Booking Available:</strong> ${listing.booking ? 'Yes' : 'No'}</p>
          <p><strong>Reviews:</strong> ${listing.reviews && listing.reviews.length ? listing.reviews.join(', ') : ''}</p>
          <p><strong>Created At:</strong> ${listing.createdAt ? new Date(listing.createdAt).toLocaleString() : ''}</p>
          <p><strong>Description:</strong> ${listing.description}</p>
        </div>
      `;
      listingsContainer.appendChild(listingElement);
    });
  }
});
