const http = require("http");

const PORT = process.env.PORT || 3000;

const requestHandler = (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, world!");
};

const buttons = document.querySelectorAll(".tf-btn");

for (let i = 0; i < buttons.length; i++) {

    buttons[i].addEventListener("click", function () {

        buttons[i].classList.add("answer-clicked");

    });
}

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
