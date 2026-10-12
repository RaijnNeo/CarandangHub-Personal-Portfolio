window.onload = function() {
  const modal = document.getElementById("welcomeModal");
  const closeBtn = document.querySelector(".close-btn");

  modal.style.display = "block";

  closeBtn.onclick = function() {
    modal.style.display = "none";
  };

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
};
