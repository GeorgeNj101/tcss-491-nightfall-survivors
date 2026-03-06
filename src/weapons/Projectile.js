import Sprite from "../enemies/Sprite.js";

export default class Projectile extends Sprite {
    constructor(x, y, dx, dy, weaponStats = null) {
        const sprite = (weaponStats && weaponStats.projectileSprite) || "assets/Fireball.png";
        
        // Dynamically get cols/rows from stats, or default to 4x4 (for the Fireball)
        const cols = (weaponStats && weaponStats.cols) || 4;
        const rows = (weaponStats && weaponStats.rows) || 4;
        const radius = (weaponStats && weaponStats.radius) || 20;
        super(sprite, { x, y, cols: cols, rows: rows, radius: radius });

        this.vx = dx;
        this.vy = dy;
        this.damage = (weaponStats && weaponStats.damage) || 10;
        this.speed = (weaponStats && weaponStats.projectileSpeed) ? weaponStats.projectileSpeed / 60 : 8;
        this.size = (weaponStats && weaponStats.size) || 64; // Default size for drawing

        this.timer = 0;
        this.maxTime = (weaponStats && weaponStats.range) ? Math.ceil(weaponStats.range / (this.speed || 1)) : 200;
        
        // Save the enemy flag for collision logic
        this.fromEnemy = (weaponStats && weaponStats.fromEnemy) || false;
        
        // Used to make the Shuriken spin visually!
        this.angle = 0;

        // Only set an initial directional row if the sprite has multiple rows
        this.rowdir = 0;
        if (this.rows > 1) {
            if(this.vx === 1) {
                this.rowdir = (this.vy === 1) ? 0 : 3;
            } else {
                this.rowdir = (this.vy === 1) ? 2 : 1;
            }
        }
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

        // 1. Only update the row direction if the sprite has multiple rows (like Fireballs)
        if (this.rows > 1) {
            if (this.vx < 0) {
                this.rowdir = (this.vy > 0) ? 0 : 3;
            } else {
                this.rowdir = (this.vy < 0) ? 2 : 1;
            }
        } else {
            this.rowdir = 0; // Lock to the first row for Shurikens
        }
        
        // 2. Cycle frames based on actual columns, NOT hardcoded 4
        let frame = gameFrame % this.cols;
        
        const drawW = this.size;
        const drawH = this.size;

        // Anchor the drawing exactly to the center of the physical hitbox
        const dx = screenX + (this.frameWidth / 2) - (drawW / 2);
        const dy = screenY + (this.frameHeight / 2) - (drawH / 2);

        // 3. Add a spin effect for 1-row sprites (Shurikens)
        if (this.rows === 1) {
            this.angle += 0.2; // Adjust spin speed here
            
            ctx.save();
            // Translate to the center point of the sprite
            ctx.translate(dx + drawW / 2, dy + drawH / 2);
            ctx.rotate(this.angle); // Rotate the canvas
            
            // Draw the sprite, but offset by half width/height so it rotates around the center
            ctx.drawImage(
                this.image, 
                frame * this.frameWidth, this.rowdir * this.frameHeight, 
                this.frameWidth, this.frameHeight, 
                -drawW / 2, -drawH / 2, 
                drawW, drawH
            );
            ctx.restore();
        } else {
            // Standard drawing for multi-row sprites (Fireballs)
            ctx.drawImage(
                this.image, 
                frame * this.frameWidth, this.rowdir * this.frameHeight, 
                this.frameWidth, this.frameHeight, 
                dx, dy, 
                drawW, drawH
            );
        }

        if (this.showHitbox) {
            ctx.beginPath();
            ctx.strokeStyle = "yellow";
            ctx.arc(screenX + this.frameWidth/2, screenY + this.frameHeight/2, this.radius, 0, Math.PI*2);
            ctx.stroke();
        }
    }
}