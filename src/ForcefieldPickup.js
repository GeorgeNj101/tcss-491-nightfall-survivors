import Sprite from "./enemies/Sprite.js";

export default class ForcefieldPickup extends Sprite {
    constructor(x, y) {
        super("assets/forcefield.png", {
            x: x, 
            y: y, 
            cols: 1,
            rows: 1,
            radius: 20 
        });

        // 1. Capture the intended center (Enemy X/Y + half an enemy's width)
        const intendedCenterX = x + 32; 
        const intendedCenterY = y + 32;

        // 2. Intercept the image load to fix the massive coordinate shift
        const originalOnload = this.image.onload;
        this.image.onload = () => {
            originalOnload(); // Let Sprite.js update the frameWidth to the massive image size
            
            // 3. Pull the top-left corner back so the center aligns with the dead enemy!
            this.x = intendedCenterX - (this.frameWidth / 2);
            this.y = intendedCenterY - (this.frameHeight / 2);
        };
    }

    draw(ctx, gameFrame, screenX, screenY) {
        if (!this.loaded) return;
        const row = 0; 
        const col = 0;

        // Make the pickup 50% smaller visually
        const scale = 0.2; 
        const drawW = this.frameWidth * scale;
        const drawH = this.frameHeight * scale;

        // Keep the shrunken image perfectly centered on its physical hitbox
        const dx = screenX + (this.frameWidth / 2) - (drawW / 2);
        const dy = screenY + (this.frameHeight / 2) - (drawH / 2);

        ctx.drawImage(
            this.image,
            col * this.frameWidth, row * this.frameHeight, 
            this.frameWidth, this.frameHeight,            
            dx, dy,                              
            drawW, drawH              
        );

        if (this.showHitbox) {
            ctx.beginPath();
            ctx.strokeStyle = "yellow";
            ctx.arc(screenX + this.frameWidth/2, screenY + this.frameHeight/2, this.radius, 0, Math.PI*2);
            ctx.stroke();
        }
    }
}