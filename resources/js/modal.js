function closeModal() {
    document.querySelector(".modal").style.display = "none";
}

function openModal() {
    clearModalFields();
    document.querySelector(".modal").style.display = "block";
}

function clearModalFields() {
    document.getElementById("group").value = "PZ-21"; 
    document.getElementById("first-name").value = "";
    document.getElementById("last-name").value = "";
    document.getElementById("gender").value = "M";
    document.getElementById("birthday").value = "";
}

window.onclick = function(event) {
    const modal = document.querySelector(".modal");
    if(event.target === modal) {
        closeModal();
    }
}
