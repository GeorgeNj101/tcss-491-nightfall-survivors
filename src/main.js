import Game from "./game.js";

window.addEventListener("load", () => {
    const canvas = document.getElementById("gameCanvas");

    // Set canvas size to fill window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game(canvas);

    // Handle window resize
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.width = canvas.width;
        game.height = canvas.height;
        if (game.camera) {
            game.camera.width = canvas.width;
            game.camera.height = canvas.height;
        }
    });
});