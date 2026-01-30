class Sprite {
    constructor(pngPath) {

        // Known sheet dimensions
        this.sheetWidth = 512;
        this.sheetHeight = 1024;
        this.cols = 4;
        this.rows = 8;

        // Safe defaults so SpriteTest and EntityTest never freeze
        this.frameWidth = this.sheetWidth / this.cols;   // 128
        this.frameHeight = this.sheetHeight / this.rows; // 128

        this.direction = 0; // 0 forward, 1 right, 2 left, 3 backward
        this.moving = false;

        this.x = 0;
        this.y = 0;

        // Load flag
        this.loaded = false;

        // Load image
        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;

            // Recompute real frame sizes from actual image
            this.frameWidth = this.image.width / this.cols;
            this.frameHeight = this.image.height / this.rows;
        };
        this.image.src = pngPath;
    }

    setDirection(num) {
        this.direction = num;
    }

    startMoving() {
        this.moving = true;
    }

    stopMoving() {
        this.moving = false;
    }

    draw(ctx, gameFrame, screenX, screenY) {

        // Prevent freeze: do not draw until image is ready
        if (!this.loaded) return;

        // row = direction * 2 + (moving ? 1 : 0)
        const row = this.direction * 2 + (this.moving ? 1 : 0);
        const col = this.moving ? (gameFrame % this.cols) : 0;

        const sx = col * this.frameWidth;
        const sy = row * this.frameHeight;

        ctx.drawImage(
            this.image,
            sx, sy,
            this.frameWidth, this.frameHeight,
            screenX, screenY,
            this.frameWidth, this.frameHeight
        );
    }
}