import Sprite from "./enemies/Sprite.js";

export default class ForcefieldPickup extends Sprite {
    constructor(x, y) {
        super("assets/forcefield.png", {
            x: x, 
            y: y, 
            cols: 1,
            rows: 1,
            sheetWidth: 64, 
            sheetHeight: 64,
            radius: 20 
        });
    }

    draw(ctx, gameFrame, screenX, screenY) {
        if (!this.loaded) return;
        const row = 0; 
        const col = 0;

        ctx.drawImage(
            this.image,
            col * this.frameWidth, row * this.frameHeight, 
            this.frameWidth, this.frameHeight,            
            screenX, screenY,                              
            this.frameWidth, this.frameHeight              
        );

        if (this.showHitbox) {
            ctx.beginPath();
            ctx.strokeStyle = "yellow";
            ctx.arc(screenX + this.frameWidth/2, screenY + this.frameHeight/2, this.radius, 0, Math.PI*2);
            ctx.stroke();
        }
    }
}
