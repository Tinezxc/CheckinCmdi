// Open Modal
        function openModal(event) {
            if (event) event.preventDefault();
            document.getElementById('forgotModal').classList.add('active');
        }

        // Close Modal
        function closeModal() {
            document.getElementById('forgotModal').classList.remove('active');
        }

        // Close when clicking outside the modal
        document.getElementById('forgotModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeModal();
            }
        });

        // Handle Form Submit (Simulate sending link)
        function handleSubmit(event) {
            event.preventDefault();
            alert('A reset link has been sent to your email!');
            closeModal();
        }