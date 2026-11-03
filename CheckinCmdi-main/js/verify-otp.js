document.addEventListener('DOMContentLoaded', () => {
    const email = sessionStorage.getItem('haven_otp_email');
    if (!email) {
        window.location.href = 'register.html';
        return;
    }

    document.getElementById('displayEmail').textContent = email;

    const form = document.getElementById('otpForm');
    const boxes = document.querySelectorAll('.otp-box');
    const errorMsg = document.getElementById('otpError');
    const stepInput = document.getElementById('stepInput');
    const stepSuccess = document.getElementById('stepSuccess');

    // --- Auto-advance logic ---
    boxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            // Only allow numbers
            if (!/^\d$/.test(val)) {
                box.value = '';
                return;
            }
            
            box.classList.add('filled');
            if (index < boxes.length - 1) {
                boxes[index + 1].focus();
            } else {
                // If it's the last box, auto-submit
                form.dispatchEvent(new Event('submit'));
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                boxes[index - 1].focus();
            }
        });
        
        // Handle paste
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const data = e.clipboardData.getData('text').replace(/\D/g, '');
            if (data.length === 6) {
                boxes.forEach((b, i) => {
                    if (data[i]) {
                        b.value = data[i];
                        b.classList.add('filled');
                    }
                });
                boxes[5].focus();
                form.dispatchEvent(new Event('submit'));
            }
        });
    });

    // --- Form Submit (Verify) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';
        
        const code = Array.from(boxes).map(b => b.value).join('');
        
        if (code.length < 6) {
            errorMsg.textContent = 'Please enter the full 6-digit code.';
            return;
        }

        // Visual feedback
        boxes.forEach(b => b.disabled = true);

        try {
            const { data, error } = await window.supabaseClient.auth.verifyOtp({
                email: email,
                token: code,
                type: 'signup'
            });

            if (error) throw error;

            // Success!
            stepInput.classList.add('hidden');
            stepSuccess.classList.remove('hidden');
            sessionStorage.removeItem('haven_otp_email');

        } catch (err) {
            console.error('OTP Error:', err);
            errorMsg.textContent = 'Invalid or expired code. Please try again.';
            
            // Shake animation on error
            document.querySelector('.otp-inputs').style.animation = 'shake 0.4s ease';
            setTimeout(() => {
                document.querySelector('.otp-inputs').style.animation = '';
            }, 400);

            // Clear boxes
            boxes.forEach(b => {
                b.disabled = false;
                b.value = '';
                b.classList.remove('filled');
            });
            boxes[0].focus();
        }
    });

    // --- Continue button ---
    document.getElementById('continueBtn').addEventListener('click', () => {
        window.location.href = 'index.html'; 
    });
});