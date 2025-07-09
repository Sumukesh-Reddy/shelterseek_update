function back(){
    window.location.href="/";
}
const messages = JSON.parse(localStorage.getItem("messages")) || [];

const messagesList = document.getElementById("messages-list");

if (messages.length === 0) {
    messagesList.innerHTML = "<p>No messages found.</p>";
} else {

    messages.forEach((message) => {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");

        messageDiv.innerHTML = `
            <h3>To: ${message.hostName}</h3>
            <p>${message.message}</p>
            <p class="timestamp">Sent on: ${message.timestamp}</p>
        `;

        messagesList.appendChild(messageDiv);
    });
}
document.getElementById("homeBtn").addEventListener("click", back);
