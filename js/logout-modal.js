document.addEventListener('DOMContentLoaded', () => {
    // 1. Create the Modal HTML dynamically
    const modalHTML = `
        <div class="logout-modal-overlay" id="logoutModalOverlay">
            <div class="logout-modal">
                <div class="logout-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </div>
                <h3>Logout</h3>
                <p>Are you sure you want to log out of Haven?</p>
                <div class="logout-actions">
                    <button class="btn-cancel-logout" id="cancelLogoutBtn">Cancel</button>
                    <button class="btn-confirm-logout" id="confirmLogoutBtn">Yes, Logout</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('logoutModalOverlay');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');

    // 2. Global function to trigger the modal
    window.handleLogout = function(e) {
        if (e) e.preventDefault();
        overlay.classList.add('active');
    };

    // 3. Close modal on cancel
    cancelBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
    });

    // 4. Perform logout on confirm
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.textContent = 'Logging out...';
        confirmBtn.disabled = true;
        
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // 5. Close modal if clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });
});