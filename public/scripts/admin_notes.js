// Load notes from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
    loadNotes();
    setupProfileDropdown();
});

// Profile dropdown toggle
function setupProfileDropdown() {
    document.getElementById("profile-toggle").addEventListener("click", function(event) {
        event.preventDefault();
        const dropdown = document.getElementById("profile-dropdown");
        const isVisible = dropdown.classList.contains("active");

        const allDropdowns = document.querySelectorAll(".dropdown-menu");
        allDropdowns.forEach(d => d.classList.remove("active"));

        if (!isVisible) {
            dropdown.classList.add("active");
        }
    });

    document.addEventListener("click", function(event) {
        const isClickInsideDropdown = event.target.closest(".dropdown");
        if (!isClickInsideDropdown) {
            document.querySelectorAll(".dropdown-menu").forEach(dropdown => {
                dropdown.classList.remove("active");
            });
        }
    });
}

// Notes data structure
let notes = JSON.parse(localStorage.getItem("notes")) || [];

// Load and display notes
function loadNotes() {
    const notesUl = document.getElementById("notes-ul");
    notesUl.innerHTML = "";
    notes.forEach((note, index) => {
        const li = document.createElement("li");
        li.classList.add("note-item");
        li.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            ${note.eventTime ? `<p class="event-time">Scheduled: ${new Date(note.eventTime).toLocaleString()}</p>` : ""}
            <div class="actions">
                <button onclick="deleteNote(${index})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        notesUl.appendChild(li);
    });
}

// Add new note/event and redirect to index.html
document.getElementById("add-note-btn").addEventListener("click", () => {
    const title = document.getElementById("note-title").value.trim();
    const content = document.getElementById("note-content").value.trim();
    const eventTime = document.getElementById("event-datetime").value;

    if (title || content || eventTime) {
        notes.push({
            title: title || "Untitled",
            content: content || "",
            eventTime: eventTime || null
        });
        localStorage.setItem("notes", JSON.stringify(notes));
        loadNotes();

        // Show a confirmation message and redirect
        document.getElementById("add-note-btn").textContent = "Note Added!";
        document.getElementById("add-note-btn").style.backgroundColor = "#48bb78";
        setTimeout(() => {
            window.location.href = "index.html"; // Redirect to index.html
        }, 1000); // Delay for 1 second to show the confirmation
    } else {
        alert("Please enter a title, content, or schedule an event!");
    }
});

// Delete note
function deleteNote(index) {
    notes.splice(index, 1);
    localStorage.setItem("notes", JSON.stringify(notes));
    loadNotes();
}