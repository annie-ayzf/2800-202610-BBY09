
const buttons = document.querySelectorAll(".tf-btn");

for (let i = 0; i < buttons.length; i++) {

    buttons[i].addEventListener("click", function () {

        buttons[i].classList.add("answer-clicked");

    });
}
