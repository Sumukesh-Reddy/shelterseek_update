document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.btn-delete');
    const viewButtons = document.querySelectorAll('.btn-view');
    const searchInput = document.getElementById('searchInput');
    const searchToggle = document.getElementById('searchToggle');
    const backButton = document.getElementById('back_admin');
  
    // DELETE USER
    deleteButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const row = button.closest('tr');
        const userId = row.dataset.userId;
  
        if (confirm("Are you sure you want to delete this user?")) {
          try {
            const response = await fetch(`/admin/notifications/delete/${userId}`, {
              method: 'DELETE'
            });
  
            const result = await response.json();
            if (response.ok && result.success) {
              row.remove();
              alert("User deleted successfully.");
            } else {
              alert("Failed to delete user: " + result.message);
            }
          } catch (err) {
            console.error("Error deleting user:", err);
            alert("An error occurred while trying to delete the user.");
          }
        }
      });
    });
  
    // VIEW USER DETAILS
    viewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const userId = row.getAttribute('data-user-id');
        const accountType = row.children[2].textContent.trim().toLowerCase();
  
        if (accountType === 'host') {
          window.location.href = `/hosts/${userId}`;
        } else if (accountType === 'traveller') {
          window.location.href = `/users/${userId}`;
        }
      });
    });
  
    // LIVE SEARCH FILTER
    const filterRows = () => {
      const query = searchInput.value.toLowerCase();
      document.querySelectorAll('tbody tr').forEach(row => {
        const name = row.children[0].textContent.toLowerCase();
        const email = row.children[1].textContent.toLowerCase();
        row.style.display = (name.includes(query) || email.includes(query)) ? '' : 'none';
      });
    };
  
    searchInput.addEventListener('input', filterRows);
    searchToggle.addEventListener('click', filterRows);
  
    // BACK BUTTON
    backButton.addEventListener('click', () => {
      window.location.href = "/admin_index";
    });
  });
  