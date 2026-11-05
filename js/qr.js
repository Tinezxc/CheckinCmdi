document.addEventListener('DOMContentLoaded', () => {
    // Setup close buttons
    const closeBtn = document.getElementById('qrClose');
    const doneBtn = document.getElementById('qrCloseBtn');
    const overlay = document.getElementById('qrOverlay');
    
    if (closeBtn) closeBtn.addEventListener('click', closeQR);
    if (doneBtn) doneBtn.addEventListener('click', closeQR);
    
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeQR();
        });
    }
});

window.openQR = function(guestId, guestName) {
    const overlay = document.getElementById('qrOverlay');
    const frame = document.getElementById('qrFrame');
    const title = document.getElementById('qrTitle');
    const sub = document.getElementById('qrSub');

    if (!overlay || !frame) return;

    // Set text
    title.textContent = guestName || 'Guest';
    sub.innerHTML = `Guest ID <strong>${guestId}</strong>`;

    // Generate QR Code using a free API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(guestId)}`;
    
    // Inject image into frame
    frame.innerHTML = `<img src="${qrUrl}" alt="QR Code for ${guestId}" style="width:100%; height:100%; border-radius: 8px; object-fit: contain;">`;
    frame.classList.remove('is-error');

    // Show overlay
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('open'));
};

function closeQR() {
    const overlay = document.getElementById('qrOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    setTimeout(() => { overlay.hidden = true; }, 300);
}