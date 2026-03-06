import Entity from "./Entity.js";
import Projectile from "../weapons/Projectile.js"; // Don't forget to import this!

export default class DemonEnemy extends Entity {
    constructor(camera) {
        super(camera, {
            imagePath: "assets/Demon.png",
            radius: 30,
            maxHp: 20,   
            speed: 1.5,  
            damage: 15
        });

        // --- Custom Demon Stats ---
        this.shootTimer = 0;
        this.shootCooldown = 180; // Shoots every 3 seconds (assuming 60 FPS)
    }

    // Override the default update to include shooting
    update(playerX, playerY, game) {
        // 1. Keep the default movement/chase logic from Entity.js
        super.update(playerX, playerY);

        // 2. Add the custom shooting logic
        this.shootTimer++;
        if (this.shootTimer >= this.shootCooldown) {
            this.shootTimer = 0;
            this.shootInAllDirections(game);
        }
    }

    shootInAllDirections(game) {
        // Get the exact center of the Demon
        const cx = this.x + this.frameWidth / 2;
        const cy = this.y + this.frameHeight / 2;

        const demonAttackStats = {
            damage: 10,                 
            projectileSpeed: 300,       
            projectileSprite: "assets/Shuriken.png",
            cols: 6, // Add this based on your shuriken image layout
            rows: 1, // Add this based on your shuriken image layout
            fromEnemy: true,
            range: 10000,
            size : 30,
            radius: 15,
        };

        // Loop 8 times to shoot in a circle
        for (let i = 0; i < 8; i++) {
            // Calculate angle in radians (Math.PI / 4 is exactly 45 degrees)
            const angle = (Math.PI / 4) * i; 
            
            // Convert angle to normalized directional vectors
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            // Spawn the projectile
            game.projectiles.push(new Projectile(cx, cy, vx, vy, demonAttackStats));
        }
    }
}