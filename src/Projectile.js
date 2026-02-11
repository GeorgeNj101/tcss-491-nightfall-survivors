import Sprite from "./Sprite.js";

export default class Projectile extends Sprite {
    constructor(x, y, dx, dy) {
        super("assets/Bolt.png", { x, y, cols: 1, rows: 1, radius: 30});
        
        this.vx = dx; // Velocity X
        this.vy = dy; // Velocity Y
        this.speed = 8;
        this.size = 32;
        

        this.timer = 0;
        this.maxTime = 200; // Disappear after ~3 seconds (60fps)
    }

    update() {
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        // Cleanup if it flies too long
        this.timer++;
        if (this.timer > this.maxTime) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, gameFrame, screenX, screenY) {
        if (!this.loaded) return;
        // Projectile specific draw: renders smaller than the raw image
       ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, screenX, screenY, this.size, this.size);
        if (this.showHitbox) {
            ctx.beginPath();
            ctx.strokeStyle = "yellow";
            ctx.arc(screenX + this.size/2, screenY + this.size/2, this.radius, 0, Math.PI*2);
            ctx.stroke();
        }
    }
}