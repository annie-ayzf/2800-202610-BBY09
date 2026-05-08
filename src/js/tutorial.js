document.addEventListener("DOMContentLoaded", () => {
  const tutorialBtn = document.getElementById("tutorial-btn");

  tutorialBtn.addEventListener("click", function () {
    const video = document.createElement("video");
    console.log("Tutorial button clicked");
    video.src = "/images/videotest.mp4";
    video.controls = true;
    video.autoplay = true;

    // When video ends, remove it and show the button again
    video.addEventListener("ended", () => {
      video.replaceWith(tutorialBtn);
    });

    this.replaceWith(video);
  });
});
