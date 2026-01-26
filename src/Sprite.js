class Sprite {
    constructor(pngPath) {

        this.sheetWidth = 512;
        this.sheetHeight = 1024;
        this.cols = 4;   // 4 frames per row
        this.rows = 8;   // 8 animation rows

        this.frameWidth = this.sheetWidth / this.cols;   // 128
        this.frameHeight = this.sheetHeight / this.rows; // 128

        this.direction = 0; // 0 forward, 1 right, 2 left, 3 backward
        this.moving = false;

        this.image = new Image();
        this.image.src = pngPath;

        this.x = 0;
        this.y = 0;
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

        // row = direction * 2 + (moving ? 1 : 0)
        const row = this.direction * 2 + (this.moving ? 1 : 0);
        const col = this.moving
            ? gameFrame % this.cols
            : 0;

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