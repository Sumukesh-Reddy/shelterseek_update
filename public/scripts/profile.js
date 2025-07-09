document.addEventListener("DOMContentLoaded", async function () {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

    if (!currentUser) {
        console.error("No user found in sessionStorage");
        alert("Please log in to view your profile.");
        window.location.href = "/loginweb";
        return;
    }

    console.log("Current user from sessionStorage:", currentUser);

    // Retry fetch with exponential backoff
    async function fetchUserData(attempt = 1, maxAttempts = 3) {
        try {
            const response = await fetch(`/api/users?email=${encodeURIComponent(currentUser.email)}&accountType=${currentUser.accountType}`, {
                credentials: 'include'
            });
            console.log(`Fetch attempt ${attempt} - API response status:`, response.status);
            const result = await response.json();
            console.log(`Fetch attempt ${attempt} - API response data:`, result);

            if (result.status === "success") {
                const user = result.data.travelers[0] || result.data.hosts[0];
                if (user) {
                    console.log("Fetched user data:", user);
                    // Update sessionStorage with latest data
                    const updatedUser = {
                        ...currentUser,
                        profilePhoto: user.profilePhoto
                    };
                    sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
                    // Set profile photo
                    const profilePicElement = document.getElementById("profile-pic");
                    if (!profilePicElement) {
                        console.error("Profile picture element not found in DOM");
                    } else if (user.profilePhoto) {
                        console.log("Setting profile photo URL:", user.profilePhoto);
                        profilePicElement.src = user.profilePhoto;
                        // Verify image load
                        profilePicElement.onerror = () => {
                            console.error("Failed to load profile photo:", user.profilePhoto);
                            profilePicElement.src = "/images/sai.png";
                        };
                    } else {
                        console.log("No profile photo found, using default");
                        profilePicElement.src = "/images/sai.png";
                    }
                } else {
                    console.error("No user data returned from API");
                }
            } else {
                console.error(`API returned non-success status: ${result.message}`);
                throw new Error(result.message || "API fetch failed");
            }
        } catch (error) {
            console.error(`Fetch attempt ${attempt} failed:`, error.message);
            if (attempt < maxAttempts) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`Retrying after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchUserData(attempt + 1, maxAttempts);
            }
            // Fallback to sessionStorage
            console.error("All fetch attempts failed, using sessionStorage data");
            const profilePicElement = document.getElementById("profile-pic");
            if (profilePicElement) {
                profilePicElement.src = currentUser.profilePhoto || "/images/sai.png";
                console.log("Fallback to sessionStorage profilePhoto:", currentUser.profilePhoto || "/images/sai.png");
            }
        }
    }

    await fetchUserData();

    // Populate profile data
    const nameElement = document.getElementById("profile-name");
    const emailElement = document.getElementById("profile-email");
    const accountTypeElement = document.getElementById("profile-account-type");

    if (nameElement) nameElement.textContent = currentUser.name || "Unknown";
    else console.error("Profile name element not found");
    if (emailElement) emailElement.textContent = currentUser.email || "Unknown";
    else console.error("Profile email element not found");
    if (accountTypeElement) accountTypeElement.textContent = currentUser.accountType || "Unknown";
    else console.error("Profile account type element not found");

    const activityButton = document.getElementById("activity");
    if (activityButton) {
        activityButton.addEventListener("click", () => {
            if (currentUser.accountType === "host") {
                window.location.href = "/dashboard";
            }
            if (currentUser.accountType === "traveller") {
                window.location.href = "/history";
            }
        });
    } else {
        console.error("Activity button not found");
    }

    // Set login/logout button
    const loginLogoutButton = document.getElementById("login-logout-text");
    if (loginLogoutButton) {
        loginLogoutButton.textContent = "Logout";
        loginLogoutButton.addEventListener("click", function () {
            sessionStorage.removeItem("currentUser");
            window.location.href = "/";
        });
    } else {
        console.error("Login/logout button not found");
    }

    // Handle profile picture change
    const changeProfilePicButton = document.getElementById("change-profile-pic");
    if (changeProfilePicButton) {
        const profilePicInput = document.createElement("input");
        profilePicInput.type = "file";
        profilePicInput.accept = "image/*";
        profilePicInput.style.display = "none";

        changeProfilePicButton.addEventListener("click", function () {
            profilePicInput.click();
        });

        profilePicInput.addEventListener("change", async function (e) {
            const file = e.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append("image", file);

                try {
                    console.log("Uploading new profile photo...");
                    const response = await fetch("/api/images", {
                        method: "POST",
                        body: formData,
                        credentials: "include",
                    });
                    const result = await response.json();
                    console.log("Image upload response:", result);

                    if (result.status === "success") {
                        // Update user profile with new photo ID
                        const updateResponse = await fetch("/api/update-profile-photo", {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                email: currentUser.email,
                                accountType: currentUser.accountType,
                                profilePhoto: result.data.id,
                            }),
                            credentials: "include",
                        });
                        const updateResult = await updateResponse.json();
                        console.log("Profile photo update response:", updateResult);

                        if (updateResult.status === "success") {
                            const updatedUser = {
                                ...currentUser,
                                profilePhoto: `/api/images/${result.data.id}`,
                            };
                            sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
                            const profilePicElement = document.getElementById("profile-pic");
                            if (profilePicElement) {
                                profilePicElement.src = updatedUser.profilePhoto;
                                console.log("Profile photo updated to:", updatedUser.profilePhoto);
                            }
                            showAlert("Profile picture updated successfully!", "success");
                        } else {
                            throw new Error(updateResult.message || "Failed to update profile photo");
                        }
                    } else {
                        throw new Error(result.message || "Failed to upload image");
                    }
                } catch (error) {
                    console.error("Error updating profile photo:", error.message);
                    showAlert(error.message || "Failed to update profile photo", "error");
                }
            }
        });
    } else {
        console.error("Change profile picture button not found");
    }

    // Handle password change
    const changePasswordForm = document.getElementById("change-password-form");
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const currentPassword = document.getElementById("current-password").value;
            const newPassword = document.getElementById("new-password").value;
            const confirmPassword = document.getElementById("confirm-password").value;

            // Client-side validation
            if (newPassword !== confirmPassword) {
                showAlert("New passwords don't match!", "error");
                return;
            }

            if (newPassword.length < 8) {
                showAlert("Password must be at least 8 characters long!", "error");
                return;
            }

            try {
                console.log("Submitting password change request...");
                const response = await fetch("/api/change-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: currentUser.email,
                        currentPassword,
                        newPassword,
                        accountType: currentUser.accountType,
                    }),
                    credentials: "include",
                });

                const data = await response.json();
                console.log("Password change response:", data);

                if (!response.ok) {
                    throw new Error(data.message || "Failed to change password");
                }

                showAlert("Password changed successfully!", "success");
                changePasswordForm.reset();
            } catch (error) {
                console.error("Password change error:", error.message);
                showAlert(error.message || "Failed to change password. Please try again.", "error");
            }
        });
    } else {
        console.error("Change password form not found");
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;

        const container = document.querySelector(".profile-container");
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
            setTimeout(() => alertDiv.remove(), 3000);
        } else {
            console.error("Profile container not found for alert");
        }
    }
});