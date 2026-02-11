export default class Sprite {
    constructor(pngPath, config = {}) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        

        this.sheetWidth = config.sheetWidth || 512;
        this.sheetHeight = config.sheetHeight || 1024;
        this.cols = config.cols || 4;
        this.rows = config.rows || 8;

        this.frameWidth = this.sheetWidth / this.cols;
        this.frameHeight = this.sheetHeight / this.rows;

        // Animation state
        this.direction = 0; 
        this.moving = false;
        this.markedForDeletion = false;

        // Image Loading
        this.loaded = false;
        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;
            // Optional: Recalculate frame size if image is different than expected
            this.frameWidth = this.image.width / this.cols;
            this.frameHeight = this.image.height / this.rows;
        };
        this.image.src = pngPath;

        this.radius = config.radius || (this.frameWidth / 2.5); 
        
        // see hitboxes
        this.showHitbox = true;
    }

   
    checkCollision(other) {
        return (
            this.x < other.x + other.frameWidth &&
            this.x + this.frameWidth > other.x &&
            this.y < other.y + other.frameHeight &&
            this.y + this.frameHeight > other.y
        );
    }

    // Distance-based Collision (Circle)
    getDistance(other) {
        // Calculate center points
        const cx1 = this.x + this.frameWidth / 2;
        const cy1 = this.y + this.frameHeight / 2;
        const cx2 = other.x + other.frameWidth / 2;
        const cy2 = other.y + other.frameHeight / 2;

        return Math.hypot(cx2 - cx1, cy2 - cy1);
    }

    collidesWith(other) {
        // 1. Get centers
        const dx = (this.x + this.frameWidth/2) - (other.x + other.frameWidth/2);
        const dy = (this.y + this.frameHeight/2) - (other.y + other.frameHeight/2);
        
        // 2. Get distance
        const distance = Math.hypot(dx, dy);

        // 3. Check if circles overlap
        return distance < (this.radius + other.radius);
    }

    

    draw(ctx, gameFrame, screenX, screenY) {
        if (!this.loaded) return;

        // row = direction * 2 + (moving ? 1 : 0)
        // This formula assumes the 4x8 sprite sheet layout
        const row = this.direction * 2 + (this.moving ? 1 : 0);
        const col = this.moving ? (gameFrame % this.cols) : 0;

        ctx.drawImage(
            this.image,
            col * this.frameWidth, row * this.frameHeight, // Source X, Y
            this.frameWidth, this.frameHeight,             // Source W, H
            screenX, screenY,                              // Dest X, Y
            this.frameWidth, this.frameHeight              // Dest W, H
        );

    
        if (this.showHitbox) {
            ctx.beginPath();
            ctx.strokeStyle = "red";
            ctx.arc(screenX + this.frameWidth/2, screenY + this.frameHeight/2, this.radius, 0, Math.PI*2);
            ctx.stroke();
        }
    }
    
}