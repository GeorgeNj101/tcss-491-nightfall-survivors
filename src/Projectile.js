import Sprite from "./Sprite.js";

export default class Projectile extends Sprite {
    constructor(x, y, target) {
        // Bolt is a single image, treat as 1 col / 1 row
        super("assets/Bolt.png", { x, y, cols: 1, rows: 1, radius: 10});
        
        this.target = target;
        this.speed = 12;
        this.size = 32; // Custom draw size
    }

    update() {
        if (!this.target || this.target.markedForDeletion) {
            this.markedForDeletion = true;
            return;
        }

        const centerX = this.x + this.frameWidth / 2;
        const centerY = this.y + this.frameHeight / 2;
        const targetCenterX = this.target.x + this.target.frameWidth / 2;
        const targetCenterY = this.target.y + this.target.frameHeight / 2;

        const dx = targetCenterX - centerX;
        const dy = targetCenterY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < 20) {
            // Hit!
            this.markedForDeletion = true;
            this.target.markedForDeletion = true;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw(ctx, gameFrame, screenX, screenY) {
        if (!this.loaded) return;
        // Projectile specific draw: renders smaller than the raw image
        ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, screenX, screenY, this.size, this.size);
    }
}