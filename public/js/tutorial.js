
/* Constants */
const modal = document.getElementById("videoModal");
const openBtn = document.getElementById("tutorial-btn");
const closeBtn = document.querySelector(".close-icon");
const video = document.querySelector("video");

// Open modal
openBtn.addEventListener("click", () => {
  modal.showModal(); // Use showModal() for backdrop
  video.play();
});

// Close modal & pause video
closeBtn.addEventListener("click", () => {
  video.pause();
  modal.close();
});

// Close when clicking outside
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    video.pause();
    modal.close();
  }
});
