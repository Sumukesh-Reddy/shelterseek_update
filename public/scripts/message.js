 // Get the host's name from the URL query parameter
 const params = new URLSearchParams(window.location.search);
 const hostName = params.get("hostId");

 if (hostName) {
     console.log("Host name:", hostName); 
     document.getElementById("host-name").textContent = decodeURIComponent(hostName);
 } else {
     console.error("Host name not found in query parameters!"); 
 }

 
 document.getElementById("send-message").addEventListener("click", () => {
     const messageText = document.getElementById("message-text").value;

     if (messageText.trim() === "") {
         alert("Please enter a message.");
         return;
     }

     
     const message = {
         hostName: decodeURIComponent(hostName),
         message: messageText,
         timestamp: new Date().toLocaleString(), 
     };

     
     const messages = JSON.parse(localStorage.getItem("messages")) || [];

     
     messages.push(message);

     
     localStorage.setItem("messages", JSON.stringify(messages));
     
     window.location.href = "/messages";
 });