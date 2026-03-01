import Sprite from "./Sprite.js";

export default class Projectile extends Sprite {
    rowdir
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} dx  - normalized direction x
     * @param {number} dy  - normalized direction y
     * @param {object} [weaponStats] - optional stats from the weapon that fired this
     *   { damage, projectileSpeed, range, projectileSprite }
     */
    constructor(x, y, dx, dy, weaponStats = null) {
        const sprite = (weaponStats && weaponStats.projectileSprite) || "assets/Fireball.png";
        super(sprite, { x, y, cols: 4, rows: 4, radius: 30});

        this.vx = dx;
        this.vy = dy;
        this.damage = (weaponStats && weaponStats.damage) || 10;
        this.speed = (weaponStats && weaponStats.projectileSpeed) ? weaponStats.projectileSpeed / 60 : 8;
        this.size = 32;

        this.timer = 0;
        this.maxTime = (weaponStats && weaponStats.range) ? Math.ceil(weaponStats.range / (this.speed || 1)) : 200;

        if(this.vx===1){
            if(this.vy===1){
                this.rowdir=0;
            }else{
                this.rowdir=3
            }
        }else {
            if(this.vy===1){
                this.rowdir=2
            }else{
                this.rowdir=1
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
    if (this.vx < 0) {
        this.rowdir = (this.vy > 0) ? 0 : 3;
    } else {
        this.rowdir = (this.vy < 0) ? 2 : 1;
    }
    let frame = gameFrame % 4;
    
    if (!this.loaded) return;

    // Use the custom size you want (32px)
    const drawW = this.size;
    const drawH = this.size;

    // Anchor the drawing exactly to the center of the physical hitbox
    const dx = screenX + (this.frameWidth / 2) - (drawW / 2);
    const dy = screenY + (this.frameHeight / 2) - (drawH / 2);

    ctx.drawImage(
        this.image, 
        frame * this.frameWidth, this.rowdir * this.frameHeight, 
        this.frameWidth, this.frameHeight, 
        dx, dy, 
        drawW, drawH
    );

    if (this.showHitbox) {
        ctx.beginPath();
        ctx.strokeStyle = "yellow";
        // Anchor the debug circle exactly to the physics center
        ctx.arc(screenX + this.frameWidth/2, screenY + this.frameHeight/2, this.radius, 0, Math.PI*2);
        ctx.stroke();
    }
}
}