import Sprite from "./Sprite.js";

export default class Entity extends Sprite {
    constructor(camera) {

        if(Math.random()<0.5) {
            super("assets/Chicken_Enemy.png", {
                radius: 40
            });
        }else{
            super("assets/Demon.png", {
                radius: 30
            });
        }


        this.spawn(camera);
        this.speed = 2; 
    }

    spawn(camera) {
    const offset = 200; 
    // Spawn relative to CAMERA position, not 0,0
    const spawnX = camera.x + (Math.random() * (camera.width + offset * 2)) - offset;
    const spawnY = camera.y + (Math.random() * (camera.height + offset * 2)) - offset;

    // Check if inside the CURRENT view (camera view)
    if (
        spawnX > camera.x && spawnX < camera.x + camera.width &&
        spawnY > camera.y && spawnY < camera.y + camera.height
    ) {
        // If spawned inside screen, push it out
        this.y = (Math.random() > 0.5) ? camera.y - offset : camera.y + camera.height + offset;
        this.x = spawnX;
    } else {
        this.x = spawnX;
        this.y = spawnY;
    }
}

    update(playerX, playerY) {
        // 1. Calculate Center Points
        const myCx = this.x + this.frameWidth / 2;
        const myCy = this.y + this.frameHeight / 2;
        const plCx = playerX + 32; // Assuming player center roughly
        const plCy = playerY + 32;

        const dx = plCx - myCx;
        const dy = plCy - myCy;
        const angle = Math.atan2(dy, dx);

        // 2. Set Direction based on angle
        // -PI/4 to PI/4 is Right (approx)
        const degrees = angle * (180 / Math.PI);
        
        if (degrees > -45 && degrees <= 45) this.direction = 1;      // Right
        else if (degrees > 45 && degrees <= 135) this.direction = 0; // Down (Forward)
        else if (degrees > -135 && degrees <= -45) this.direction = 3; // Up (Backward)
        else this.direction = 2;                                     // Left

        // 3. Move towards player
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.moving = true;
        } else {
            this.moving = false;
        }
    }

    // For Z-Index sorting
    getBottomY() {
        return this.y + this.frameHeight;
    }
}