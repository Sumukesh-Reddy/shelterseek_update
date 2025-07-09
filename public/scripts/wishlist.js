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

async function fetchRooms() {
    try {
      const response = await fetch(`http://localhost:${port}/api/rooms`);
      
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

function formatCurrency(number) {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(number);
}

document.addEventListener("DOMContentLoaded", async () => {
    let likedHomes = JSON.parse(localStorage.getItem("likedHomes")) || [];
    const sent = [
        "Lets Connect To Each Other",
        "Let's confirm our room booking for the day",
        "Let's secure a room for our gathering",
        "Let's link up and connect",
        "Let's come together and bond",
        "How about we connect and share ideas?",
        "Let's get together and connect",
        "Let's establish a connection between us",
    ];

    var sen = document.getElementById("wishlist-span-1");
    var i = 0;

    function changeSentence() {
        if (sen) {
            sen.innerText = sent[i];
            i++;
            if (i === sent.length) i = 0;
        }
    }

    if (sen) {
        setInterval(changeSentence, 2000);
    }

    // Create a link element for navigation
    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);

    // Display liked homes
    let likedRoomsContainer = document.getElementById("likedrooms");

    if (likedRoomsContainer) {
        // Fetch rooms from API
        const rooms = await fetchRooms();
        
        // Filter and display only liked rooms
        const likedRooms = rooms.filter(room => likedHomes.includes(room._id));
        
        if (likedRooms.length === 0) {
            likedRoomsContainer.innerHTML = '<p class="no-liked">You have no saved rooms in your wishlist.</p>';
            return;
        }

        likedRooms.forEach((room) => {
            addHomeToPage(room);
        });
    }

    function addHomeToPage(room) {
        const container = document.getElementById("likedrooms");
        if (!container) return;

        const homeBlock = document.createElement("div");
        homeBlock.classList.add("home-block");

        // Process the room data to match the structure expected by the template
        const processedRoom = {
            id: room._id,
            title: room.title || "Untitled Property",
            location: room.location || "Location not specified",
            price: parseFloat(room.price) || 0,
            description: room.description || "",
            discountPercentage: room.discount || 0,
            images: room.images ? processImagePaths(room.images) : ['/images/photo1.jpg']
        };

        homeBlock.innerHTML = `
            <div class="home-photos-block">
                <div class="home-image" style="background-image: url('${processedRoom.images[0]}')"
                     onerror="this.style.backgroundImage='url(/images/photo1.jpg)'"></div> 
            </div>
            <hr style="opacity: 0.3;">
            <div class="home-content">
                <h3>${processedRoom.title}</h3>
                <p>Location: ${processedRoom.location}</p>
                <p class="price">${formatCurrency(processedRoom.price * (1 - processedRoom.discountPercentage / 100))}</p>
                <span class="old-price">${formatCurrency(processedRoom.price)}</span>
                <p style="color: green;font-weight: bold;">Discount : ${processedRoom.discountPercentage}% off</p>
                <p>Description: ${processedRoom.description}</p>
            </div>
        `;

        homeBlock.addEventListener("click", () => {
            link.href = `/room_layout?id=${processedRoom.id}`;
            link.click();
        });

        container.appendChild(homeBlock);
    }

    // Process image paths (same as in sumukesh_layout.js)
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
});