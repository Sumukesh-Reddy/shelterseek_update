function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function refreshHostRequests() {
    console.log('Fetching host requests from /api/host-requests');
    fetch('/api/host-requests')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            window.hostRequests = data.data || [];
            console.log('Host requests fetched:', window.hostRequests);
            populateHostRequests();
        })
        .catch(error => console.error('Error refreshing host requests:', error.message));
}

function populateHostRequests(filteredRequests = window.hostRequests) {
    console.log('Populating host requests with:', filteredRequests);
    const hostRequestsList = document.querySelector(".host-requests-list");
    if (!hostRequestsList) {
        console.error('Host requests list element not found');
        return;
    }
    hostRequestsList.innerHTML = "";

    if (!filteredRequests || filteredRequests.length === 0) {
        const noResults = document.createElement("p");
        noResults.classList.add("no-results");
        noResults.textContent = "No hosts found. Try a different host name.";
        hostRequestsList.appendChild(noResults);
        return;
    }

    filteredRequests.forEach((request, index) => {
        if (!request._id) {
            console.warn('Missing _id for request:', request);
            return;
        }

        const hostRequestCard = document.createElement("div");
        hostRequestCard.classList.add("host-request-card");
        hostRequestCard.dataset.id = request._id;

        console.log(`Rendering request ${request._id}:`, { title: request.title, images: request.images });
        const image = document.createElement("img");
        if (request.images && request.images.length > 0 && request.images[0] !== '/images/placeholder.png') {
            console.log(`Using image for request ${request._id}: ${request.images[0]}`);
            image.src = request.images[0];
            image.alt = sanitizeString(request.title) || 'Host Request';
            image.loading = "lazy";
            image.dataset.imageId = `${request._id}-${index}`;
            image.onerror = () => {
                console.error(`Failed to load image for request ${request._id}: ${image.src}`);
                image.src = '/images/placeholder.png';
                image.alt = 'Placeholder Image';
            };
        } else {
            console.log(`No valid images for request ${request._id}, using placeholder`);
            image.src = '/images/placeholder.png';
            image.alt = 'No Image Available';
            image.loading = "lazy";
            image.dataset.imageId = `${request._id}-placeholder`;
        }
        hostRequestCard.appendChild(image);

        const title = document.createElement("h3");
        title.textContent = sanitizeString(request.title) || 'No title';

        const name = document.createElement("p");
        name.textContent = `Name: ${sanitizeString(request.name) || 'Unknown'}`;

        const status = document.createElement("p");
        status.textContent = `Status: ${sanitizeString(request.status) || 'pending'}`;
        status.classList.add("status", (sanitizeString(request.status) || 'pending').toLowerCase());

        hostRequestCard.append(title, name, status);
        hostRequestsList.appendChild(hostRequestCard);
    });

    addCardEventListeners();
}

function addCardEventListeners() {
    document.querySelectorAll(".host-request-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.dataset.id;
            if (id) openModal(id);
        });
    });
}

function openModal(id) {
    const modal = document.getElementById("host-details-modal");
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    const requestIndex = window.hostRequests.findIndex(req => req._id === id);
    if (requestIndex === -1) {
        console.error('Request data not found for id:', id);
        return;
    }
    const request = window.hostRequests[requestIndex];

    console.log('Opening modal for request:', request);

    document.getElementById("modal-host-name").textContent = sanitizeString(request.title) || 'No title';
    document.getElementById("modal-host-name-text").textContent = sanitizeString(request.name) || 'Unknown';
    document.getElementById("modal-host-email").textContent = sanitizeString(request.email) || 'No email';
    document.getElementById("modal-host-title").textContent = sanitizeString(request.title) || 'No title';
    document.getElementById("modal-host-description").textContent = sanitizeString(request.description) || 'No description';
    document.getElementById("modal-host-price").textContent = request.price ? `₹${sanitizeString(request.price)}/night` : 'N/A';
    document.getElementById("modal-host-location").textContent = sanitizeString(request.location) || 'N/A';
    document.getElementById("modal-host-property-type").textContent = sanitizeString(request.propertyType) || 'N/A';
    document.getElementById("modal-host-capacity").textContent = sanitizeString(request.capacity) || 'N/A';
    document.getElementById("modal-host-room-type").textContent = sanitizeString(request.roomType) || 'N/A';
    document.getElementById("modal-host-bedrooms").textContent = sanitizeString(request.bedrooms) || 'N/A';
    document.getElementById("modal-host-beds").textContent = sanitizeString(request.beds) || 'N/A';
    document.getElementById("modal-host-room-size").textContent = sanitizeString(request.roomSize) || 'N/A';
    document.getElementById("modal-host-room-location").textContent = sanitizeString(request.roomLocation) || 'N/A';
    document.getElementById("modal-host-transport-distance").textContent = sanitizeString(request.transportDistance) || 'N/A';
    document.getElementById("modal-host-gender").textContent = sanitizeString(request.hostGender) || 'N/A';
    document.getElementById("modal-host-food-facility").textContent = sanitizeString(request.foodFacility) || 'N/A';
    document.getElementById("modal-host-amenities").textContent = sanitizeString(request.amenities) || 'N/A';
    document.getElementById("modal-host-discount").textContent = sanitizeString(request.discount) || 'N/A';
    document.getElementById("modal-host-maxdays").textContent = sanitizeString(request.maxdays) || 'N/A';
    document.getElementById("modal-host-created-at").textContent = sanitizeString(request.createdAt) || 'N/A';

    const modalMedia = document.getElementById("modal-media");
    if (modalMedia) {
        modalMedia.innerHTML = "";
        const imageCarousel = document.createElement("div");
        imageCarousel.classList.add("image-carousel");
        if (request.images && request.images.length > 0 && request.images[0] !== '/images/placeholder.png') {
            console.log(`Adding images to modal for request ${request._id}:`, request.images);
            request.images.forEach((imageSrc, i) => {
                const img = document.createElement("img");
                img.src = imageSrc;
                img.alt = `Image ${i + 1} of ${sanitizeString(request.title) || 'Host Request'}`;
                img.loading = "lazy";
                img.dataset.imageId = `${request._id}-${i}`;
                img.onerror = () => {
                    console.error(`Failed to load modal image for request ${request._id}: ${imageSrc}`);
                    img.src = '/images/placeholder.png';
                    img.alt = 'Placeholder Image';
                };
                imageCarousel.appendChild(img);
            });
        } else {
            console.log(`No valid images for modal of request ${request._id}, using placeholder`);
            const placeholder = document.createElement("img");
            placeholder.src = '/images/placeholder.png';
            placeholder.alt = 'No Image Available';
            placeholder.loading = "lazy";
            placeholder.dataset.imageId = `${request._id}-placeholder`;
            imageCarousel.appendChild(placeholder);
        }
        modalMedia.appendChild(imageCarousel);
    }

    const statusDropdown = document.getElementById("modal-host-status");
    if (statusDropdown) {
        statusDropdown.value = sanitizeString(request.status) || 'pending';
    }

    modal.style.display = "flex";
    modal.dataset.requestId = id;
    document.body.style.overflow = "hidden";

    document.querySelector(".modal-actions .accept").onclick = () => updateHostStatus(id, "Approved");
    document.querySelector(".modal-actions .reject").onclick = () => updateHostStatus(id, "Rejected");
}

function updateHostStatus(id, status) {
    console.log(`Updating status for request ${id} to ${status}`);
    const acceptBtn = document.querySelector(".modal-actions .accept");
    const rejectBtn = document.querySelector(".modal-actions .reject");

    // Disable buttons to prevent multiple clicks
    acceptBtn.disabled = true;
    rejectBtn.disabled = true;

    fetch(`/api/host-requests/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.message === 'Status updated') {
            console.log('Status updated successfully, refreshing host requests');
            window.hostRequests = data.rooms || [];
            populateHostRequests();
            closeModal();
        } else {
            console.error('Failed to update status:', data);
        }
    })
    .catch(error => console.error('Error updating status:', error.message))
    .finally(() => {
        // Re-enable buttons
        acceptBtn.disabled = false;
        rejectBtn.disabled = false;
    });
}

function closeModal() {
    const modal = document.getElementById("host-details-modal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("host-details-modal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
        }
    });
    const searchInput = document.getElementById("search-host");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredRequests = window.hostRequests.filter(request =>
                (request.name && request.name.toLowerCase().includes(searchTerm)) ||
                (request.title && request.title.toLowerCase().includes(searchTerm))
            );
            populateHostRequests(filteredRequests);
        });
    }

    const closeModalBtn = document.querySelector(".modal .close-modal");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
    }

    refreshHostRequests();
});