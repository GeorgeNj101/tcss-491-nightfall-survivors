import Sprite from "./Sprite.js";

export default class XpOrb extends Sprite {
    constructor(x, y) {
        super("assets/Xp_Orb.png", { 
            x: x, 
            y: y, 
            cols: 7, 
            rows: 1,
            sheetWidth: 224, 
            sheetHeight: 32,
            radius: 15 
        });
    }

    draw(ctx, gameFrame, screenX, screenY) {
        if (!this.loaded) return;
        const row = 0; 
        
        // Cycle columns for spinning animation
        // We use Math.floor to slow it down (change / 5 to adjust speed)
        const col = Math.floor(gameFrame / 5) % this.cols; 

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