document.addEventListener('DOMContentLoaded', () => {
    const email = sessionStorage.getItem('haven_otp_email');
    if (!email) {
        // If no email is found in session, they shouldn't be here
        window.location.href = 'register.html';
        return;
    }

    // Display the email in the UI
    document.getElementById('displayEmail').textContent = email;

    const form = document.getElementById('otpForm');
    const boxes = document.querySelectorAll('.otp-box');
    const errorMsg = document.getElementById('otpError');
    const stepInput = document.getElementById('stepInput');
    const stepSuccess = document.getElementById('stepSuccess');
    const autoFillBtn = document.getElementById('autoFillBtn');
    const smsText = document.getElementById('smsText');

    // Mock OTP for the demo (since Supabase sends a 6-digit code via email)
    const DEMO_OTP = '1234';
    smsText.textContent = `${DEMO_OTP} is your verification code.`;

    // --- Auto-advance logic ---
    boxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length === 1) {
                box.classList.add('filled');
                if (index < boxes.length - 1) {
                    boxes[index + 1].focus();
                } else {
                    // If it's the last box, auto-submit
                    form.dispatchEvent(new Event('submit'));
                }
            } else {
                box.classList.remove('filled');
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
            if (data.length === 4) {
                boxes.forEach((b, i) => {
                    if (data[i]) {
                        b.value = data[i];
                        b.classList.add('filled');
                    }
                });
                boxes[3].focus();
                form.dispatchEvent(new Event('submit'));
            }
        });
    });

    // --- Mock "Fill" button logic ---
    autoFillBtn.addEventListener('click', () => {
        DEMO_OTP.split('').forEach((char, i) => {
            boxes[i].value = char;
            boxes[i].classList.add('filled');
        });
        boxes[3].focus();
        // Slight delay to let the animation show before submitting
        setTimeout(() => form.dispatchEvent(new Event('submit')), 500);
    });

    // --- Form Submit (Verify) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';
        
        const code = Array.from(boxes).map(b => b.value).join('');
        
        if (code.length < 4) {
            errorMsg.textContent = 'Please enter the full 4-digit code.';
            return;
        }

        // Visual feedback
        const btn = autoFillBtn; // Just disabling interaction
        boxes.forEach(b => b.disabled = true);

        try {
            // NOTE: Supabase requires a minimum of 6 digits by default. 
            // We are padding the 4-digit input to 6 digits for this demo.
            const supabaseOtp = code.padEnd(6, '0'); 

            const { data, error } = await window.supabaseClient.auth.verifyOtp({
                email: email,
                token: supabaseOtp,
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
        window.location.href = 'index.html'; // Redirect to login
    });
});