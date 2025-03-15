// Get modal element
const modal = document.querySelector('.modal');

// Function to open the modal
function openModal() {
    const modal = document.querySelector('.modal');
    modal.style.display = 'flex'; // Show the modal
}

// Function to close the modal
function closeModal() {
    const modal = document.querySelector('.modal');
    modal.style.display = 'none'; // Hide the modal
}

// Example: Opening the modal when a button is clicked
document.getElementById('plus-button').addEventListener('click', openModal);
