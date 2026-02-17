import Sprite from "./Sprite.js";
import Entity from "./Entity.js";
import XpOrb from "./XpOrb.js";
import Projectile from "./Projectile.js";
import Boss from "./Boss.js";
import Camera from "./Camera.js";

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.keys = {};
        this.enemies = [];
        this.xpOrbs = [];
        this.projectiles = [];
        this.gameFrame = 0;
        this.isDead = false;
        this.elapsedTime = 0;
        this.lastSecondTime = 0;
        this.lastTime = 0;
        this.score = 0;

        //FOR CHEATS/DEBUGGING
        this.cheatLocked = false;

        // --- Player Stats ---
        this.player = new Sprite("assets/Main_Character.png");
        this.player.x = this.width / 2 - 64; 
        this.player.y = this.height / 2 - 64;
        this.camera = new Camera(this.width, this.height);

        this.stats = {
            hp: 100,
            maxHp: 100,
            xp: 0,
            maxXp: 5,//changed temperoarily for testing
            level: 1,
            speed: 4,
            attackCooldown: 180,
            attackTimer: 0
        };

        // --- Wave Logic ---
        this.wave = 1;
        this.waveEnemies = 5;
        this.waveTimer = 60; // seconds
        this.waveStartTime = 0;
        this.waveEnemiesSpawned = false;
        this.bossSpawned = false;

        // --- World ---
        this.tileOffsetX = 0;
        this.tileOffsetY = 0;
        this.tileSize = 64;
        this.grassImage = new Image();
        this.grassImage.src = "assets/Grass.png";

        this.init();
    }

    init() {
        window.addEventListener("keydown", e => {
            this.keys[e.key] = true;
            if (this.isDead && e.key.toLowerCase() === 'r') location.reload();
        });
        window.addEventListener("keyup", e => this.keys[e.key] = false);
        
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    update(timestamp) {
        if (this.isDead) return;

        this.gameFrame++;
        this.updateTimers(timestamp);
        this.handleWaveSystem(timestamp);
        this.handleMovement();
        this.handleCombat();
        this.handleXpCollection();
        
        if (this.stats.hp <= 0) {
            this.isDead = true;
            this.stats.hp = 0;
        }
    }

    updateTimers(timestamp) {
        if (timestamp - this.lastSecondTime >= 1000) {
            this.elapsedTime++;
            this.lastSecondTime = timestamp;
        }
        this.stats.attackTimer++;
    }

    handleWaveSystem(timestamp) {
        // Pass the camera to the new Entity
        if (this.waveStartTime === 0) this.waveStartTime = timestamp;
        
        // Spawn Wave
        if (!this.waveEnemiesSpawned) {
            for (let i = 0; i < this.waveEnemies; i++) {
                this.enemies.push(new Entity(this.camera));
            }
            this.waveEnemiesSpawned = true;
        }

        // Check Wave Completion
        const waveElapsed = (timestamp - this.waveStartTime) / 1000;
        if (waveElapsed >= this.waveTimer || (this.enemies.length === 0 && this.waveEnemiesSpawned)) {
            this.wave++;
            this.waveEnemies += 2;
            this.waveTimer = Math.max(30, this.waveTimer - 5);
            this.waveStartTime = timestamp;
            this.waveEnemiesSpawned = false;
        }

        // Spawn a boss after 10 waves have been completed
        if (this.wave > 2 && !this.bossSpawned) {
            console.log("Spawning Boss: wave > 1");
            this.enemies.push(new Boss(this.camera));
            this.bossSpawned = true;
        }
    }

    handleMovement() {
        let dx = 0, dy = 0;
        if (this.keys["w"] || this.keys["ArrowUp"]) { dy = -1; this.player.direction = 3; }
        if (this.keys["s"] || this.keys["ArrowDown"]) { dy = 1; this.player.direction = 0; }
        if (this.keys["a"] || this.keys["ArrowLeft"]) { dx = -1; this.player.direction = 2; }
        if (this.keys["d"] || this.keys["ArrowRight"]) { dx = 1; this.player.direction = 1; }
        if (this.keys["Shift"]) {this.stats.speed = 6; console.log("DEBUG: Sprinting");}
        if (!this.keys["Shift"]) {this.stats.speed = 4; }
        this.levelActivation = false;
       
        if (this.keys["x"]) {
            // Only run if NOT locked
            if (!this.cheatLocked) {
                this.levelUp();
                console.log("DEBUG: Level Up (Cheat)");
                this.cheatLocked = true; // Lock it immediately
            }
        } else {
            // If "x" is NOT pressed, unlock it so we can press it again later
            this.cheatLocked = false;
        }
        
        // if (dx !== 0 || dy !== 0) {
        //     this.player.moving = true;
        //     const moveSpeed = this.stats.speed;
        //     this.tileOffsetX = (this.tileOffsetX + dx * moveSpeed) % this.tileSize;
        //     this.tileOffsetY = (this.tileOffsetY + dy * moveSpeed) % this.tileSize;
            
        //     // Move world objects relative to player
        //     const objects = [...this.enemies, ...this.xpOrbs, ...this.projectiles];
        //     objects.forEach(obj => {
        //         obj.x += dx * moveSpeed;
        //         obj.y += dy * moveSpeed;
        //     });
        // } else {
        //     this.player.moving = false;
        // }
        if (dx !== 0 || dy !== 0) {
            this.player.moving = true;

            // Normalize vector (prevent faster diagonal movement)
            const length = Math.hypot(dx, dy);
            dx /= length;
            dy /= length;
            

            // Move Player in WORLD coordinates
            this.player.x += dx * this.stats.speed;
            this.player.y += dy * this.stats.speed;

            this.camera.update(this.player);
        } else {
            this.player.moving = false;
        }

        // Update Camera to follow player
        // this.camera.update(this.player);
    }
    handleCombat() {
         if (this.stats.attackTimer >= this.stats.attackCooldown) {
        
            // Center the spawn point on the player
            const spawnX = this.player.x + this.player.frameWidth / 2 - 16; 
            const spawnY = this.player.y + this.player.frameHeight / 2 - 16;

            // Define the 4 diagonal directions
            const directions = [
                { x: 1,  y: -1 }, // NE (Right-Up)
                { x: 1,  y: 1 },  // SE (Right-Down)
                { x: -1, y: 1 },  // SW (Left-Down)
                { x: -1, y: -1 }  // NW (Left-Up)
            ];

            directions.forEach(dir => {
                // Normalize the vector so diagonal speed isn't faster
                // Math.hypot(1, 1) is approx 1.414
                const length = Math.hypot(dir.x, dir.y); 
                const dx = dir.x / length;
                const dy = dir.y / length;

                this.projectiles.push(new Projectile(spawnX, spawnY, dx, dy));
            });

            this.stats.attackTimer = 0;
    }
    // 1. Check Projectiles vs Enemies
    // Iterate backwards through projectiles so we can remove them safely
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update();

        // Check this single projectile against ALL enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];

            // THE COLLISION CHECK
            if (p.collidesWith(enemy)) {
                console.log("Hit registered!"); // Debug log
                
                // If enemy has HP (boss), reduce HP; otherwise kill instantly
                if (typeof enemy.hp === 'number') {
                    // Damage amount for a single projectile
                    const dmg = 50;
                    enemy.hp -= dmg;
                    console.log(`Boss hit! HP: ${enemy.hp}`);
                    p.markedForDeletion = true;
                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        // Spawn multiple XP orbs for boss
                        for (let k = 0; k < 8; k++) {
                            this.xpOrbs.push(new XpOrb(enemy.x + (Math.random()-0.5)*40, enemy.y + (Math.random()-0.5)*40));
                        }
                        this.score += 250;
                    }
                } else {
                    // Kill Enemy
                    enemy.markedForDeletion = true;
                    // Destroy Projectile
                    p.markedForDeletion = true;

                    // Spawn XP Orb at Enemy position
                    this.xpOrbs.push(new XpOrb(enemy.x, enemy.y));
                    this.score += 10;
                }

                // Break loop: This bullet can't kill 2 enemies at once
                
            }
        }
    }

    // 2. Check Enemies vs Player
    this.enemies.forEach(enemy => {
        enemy.update(this.player.x, this.player.y, this);
        
        if (this.player.collidesWith(enemy)) {
                // If this is a boss (has hp), don't auto-kill it on touch; just damage player
                if (typeof enemy.hp === 'number') {
                    if (this.stats.hp > 0) this.stats.hp -= .05;
                } else {
                    // Optional: Cooldown to prevent instant death
                    if (this.stats.hp > 0) {
                         this.stats.hp -= 20;
                    }
                    enemy.markedForDeletion = true;
                }
        }
    });

    // 3. Filter out dead objects
    this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
    this.enemies = this.enemies.filter(e => !e.markedForDeletion);
}
    handleCombat1() {
        //  Auto-Fire Projectiles
        // if (this.stats.attackTimer >= this.stats.attackCooldown) {
        //     const target = this.getNearestEnemy();
        //     if (target) {
        //         this.projectiles.push(new Projectile(this.player.x, this.player.y, target));
        //         this.stats.attackTimer = 0;
        //     }
        // }
        //
        if (this.stats.attackTimer >= this.stats.attackCooldown) {
        
            // Center the spawn point on the player
            const spawnX = this.player.x + this.player.frameWidth / 2 - 16; 
            const spawnY = this.player.y + this.player.frameHeight / 2 - 16;

            // Define the 4 diagonal directions
            const directions = [
                { x: 1,  y: -1 }, // NE (Right-Up)
                { x: 1,  y: 1 },  // SE (Right-Down)
                { x: -1, y: 1 },  // SW (Left-Down)
                { x: -1, y: -1 }  // NW (Left-Up)
            ];

            directions.forEach(dir => {
                // Normalize the vector so diagonal speed isn't faster
                // Math.hypot(1, 1) is approx 1.414
                const length = Math.hypot(dir.x, dir.y); 
                const dx = dir.x / length;
                const dy = dir.y / length;

                this.projectiles.push(new Projectile(spawnX, spawnY, dx, dy));
            });

            this.stats.attackTimer = 0;
    }
    this.projectiles.forEach(projectile => {
        projectile.update();
        for(let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (projectile.collidesWith(enemy)) {
                console.log(`DEBUG: Hit! Enemy at ${Math.floor(enemy.x)},${Math.floor(enemy.y)}`);
                // If boss (has hp), apply damage
                if (typeof enemy.hp === 'number') {
                    const dmg = 50;
                    enemy.hp -= dmg;
                    projectile.markedForDeletion = true;
                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        for (let k = 0; k < 8; k++) {
                            this.xpOrbs.push(new XpOrb(enemy.x + (Math.random()-0.5)*40, enemy.y + (Math.random()-0.5)*40));
                        }
                        this.score += 250;
                    }
                } else {
                    enemy.markedForDeletion = true;
                    projectile.markedForDeletion = true;
                    this.xpOrbs.push(new XpOrb(enemy.x, enemy.y));
                    this.score += 10;
                }

                break; // Bullet hit something, stop checking other enemies for this bullet
            }
        }   
    });


        // this.projectiles.forEach(p => {
        //     p.update();
            
        //     // Check collision with its target
        //     if (p.target && !p.target.markedForDeletion) {
        //         const dist = p.getDistance(p.target);
        //         if (dist < 30) { // Hit!
        //             console.log("DEBUG: Projectile Hit! Enemy Defeated."); // --- DEBUG LOG ---
        //             p.markedForDeletion = true;
        //             p.target.markedForDeletion = true;
                    
        //             // DROP XP ORB HERE
        //             console.log(`DEBUG: Spawning XP Orb at ${p.target.x}, ${p.target.y}`); // --- DEBUG LOG ---
        //             this.xpOrbs.push(new XpOrb(p.target.x, p.target.y));
                    
        //             this.score += 10;
        //         }
        //     }
        // });
        // this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        // this.projectiles.forEach(projectile => {
        // projectile.update();
            
        //     // Check this projectile against ALL enemies
        //     // (We iterate backwards so we can safely remove enemies from the array)
        //     for (let i = this.enemies.length - 1; i >= 0; i--) {
        //         const enemy = this.enemies[i];
                
        //         // CLEAN SYNTAX HERE:
        //         if (projectile.collidesWith(enemy)) {
        //             console.log(`DEBUG: Hit! Enemy at ${Math.floor(enemy.x)},${Math.floor(enemy.y)}`);
        //             // Logic
        //             enemy.markedForDeletion = true;
        //             projectile.markedForDeletion = true;
        //             this.xpOrbs.push(new XpOrb(enemy.x, enemy.y));
        //             this.score += 10;
        //             console.log(`DEBUG: XP Orb spawned. Total Orbs: ${this.xpOrbs.length}`);
                    
        //             break; // Bullet hit something, stop checking other enemies for this bullet
        //         }
        //     }
        // });

        // 3. Enemy Logic (Movement + Player Collision)
        this.enemies.forEach(enemy => {
            enemy.update(this.player.x, this.player.y, this);
            // const dist = enemy.getDistance(this.player);

            if (this.player.collidesWith(enemy)) {
                if (typeof enemy.hp === 'number') {
                    // Boss collision: damage player only
                    this.stats.hp -= 5;
                    console.log(`DEBUG: Player Hit by Boss! HP: ${this.stats.hp}`);
                } else {
                    // Non-boss: kill enemy and damage player
                    enemy.markedForDeletion = true;
                    this.stats.hp -=10;
                    console.log(`DEBUG: Player Hit! HP: ${this.stats.hp}`);// --- DEBUG LOG ---
                }
            }
        });
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
    }

    handleXpCollection() {
        this.xpOrbs.forEach(orb => {
            const dist = orb.getDistance(this.player);
            if (dist < 150) { // Magnet range
                const moveX = (this.player.x - orb.x) * 0.1;
                const moveY = (this.player.y - orb.y) * 0.1;
                orb.x += moveX;
                orb.y += moveY;
            }
            if (this.player.collidesWith(orb)) {
                orb.markedForDeletion = true;
                console.log("DEBUG: Orb Collected!");
                this.stats.xp++;
                if (this.stats.xp >= this.stats.maxXp) this.levelUp();
            }
        });
        this.xpOrbs = this.xpOrbs.filter(o => !o.markedForDeletion);
    }

    levelUp() {
        this.stats.level++;
        this.stats.xp = 0;
        this.stats.maxXp = Math.floor(this.stats.maxXp * 1.5);
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 20);
        this.stats.maxHp += 10;
        console.log("DEBUG: Level Up! Level " + this.stats.level);
        if (this.stats.level % 5 === 0) {
            this.stats.speed = Math.min(10, this.stats.speed + 1);
            console.log("DEBUG: Speed Increased! Speed: " + this.stats.speed);
        }
        if (this.stats.level % 3 === 0 ){
            this.stats.attackCooldown = Math.max(30, this.stats.attackCooldown - 20);
            console.log("DEBUG: Attack Speed Increased! Cooldown: " + this.stats.attackCooldown);
        }
    }

    getNearestEnemy() {
        return this.enemies.reduce((nearest, current) => {
            const dist = current.getDistance(this.player);
            if (!nearest || dist < nearest.dist) return { item: current, dist };
            return nearest;
        }, null)?.item;
    }

    isFacing(enemy) {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const facing = [90, 0, 180, -90][this.player.direction];
        let diff = Math.abs(angle - facing);
        if (diff > 180) diff = 360 - diff;
        return diff <= 50; 
    }

    draw(timestamp) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();

        const renderList = [this.player, ...this.enemies, ...this.xpOrbs, ...this.projectiles];
        renderList.sort((a, b) => (a.y + a.frameHeight) - (b.y + b.frameHeight));

        renderList.forEach(obj => {
            // Convert World Position -> Screen Position
            const screenX = obj.x - this.camera.x;
            const screenY = obj.y - this.camera.y;

            // Optimization: Only draw if visible on screen (Culling)
            // Add a buffer (e.g., 100px) so sprites don't pop out at edges
            if (
                screenX + obj.frameWidth > -100 &&
                screenX < this.width + 100 &&
                screenY + obj.frameHeight > -100 &&
                screenY < this.height + 100
            ) {
                obj.draw(this.ctx, Math.floor(this.gameFrame / 4), screenX, screenY);
            }
        });

        this.drawUI(timestamp);
        if (this.isDead) this.drawDeathScreen();
        
    }

    drawBackground() {
        // for (let x = -this.tileSize; x < this.width + this.tileSize; x += this.tileSize) {
        //     for (let y = -this.tileSize; y < this.height + this.tileSize; y += this.tileSize) {
        //         this.ctx.drawImage(this.grassImage, x + this.tileOffsetX, y + this.tileOffsetY, this.tileSize, this.tileSize);
        //     }
        // }
        // If camera moves right (positive x), background must shift left
        const offsetX = -this.camera.x % this.tileSize;
        const offsetY = -this.camera.y % this.tileSize;

        // Draw enough tiles to cover the screen
        // We start at -tileSize to prevent gaps when scrolling
        for (let x = -this.tileSize; x < this.width + this.tileSize; x += this.tileSize) {
            for (let y = -this.tileSize; y < this.height + this.tileSize; y += this.tileSize) {
                this.ctx.drawImage(
                    this.grassImage, 
                    x + offsetX, 
                    y + offsetY, 
                    this.tileSize, 
                    this.tileSize
                );
            }
        }
    }

    drawUI(timestamp) {
        const ctx = this.ctx;
        // Bars
        this.drawBar(20, 20, 200, 20, this.stats.hp / this.stats.maxHp, "red", `${Math.floor(this.stats.hp)}/${this.stats.maxHp}`);
        this.drawBar(20, 50, 200, 20, this.stats.xp / this.stats.maxXp, "blue", `${this.stats.xp}/${this.stats.maxXp}`);
        
        // Wave Info
        const waveElapsed = (timestamp - this.waveStartTime) / 1000;
        const waveRemaining = Math.max(0, this.waveTimer - waveElapsed);
        const waveMin = Math.floor(waveRemaining / 60);
        const waveSec = Math.floor(waveRemaining % 60);
        const waveFormatted = `${waveMin}:${waveSec.toString().padStart(2, '0')}`;

        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        
        ctx.textAlign = "left";
        ctx.fillText(`Time: ${Math.floor(this.elapsedTime / 60)}:${(this.elapsedTime % 60).toString().padStart(2, '0')}`, 240, 40);
        ctx.textAlign = "left";
        ctx.fillText(`level: ${this.stats.level}`, 240, 70);
        
        
        ctx.textAlign = "right";
        ctx.fillText(`Wave: ${this.wave}`, this.width - 20, 40);
        ctx.fillText(`Wave Timer: ${waveFormatted}`, this.width - 20, 70);
        ctx.fillText(`Enemies: ${this.enemies.length}`, this.width - 20, 100);
    }

    drawBar(x, y, w, h, percent, color, label) {
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(x, y, w, h);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w * percent, h);
        this.ctx.strokeStyle = "white";
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.fillStyle = "white";
        this.ctx.font = "14px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(label, x + w / 2, y + h - 5);
    }

    drawDeathScreen() {
        this.ctx.fillStyle = "rgba(0,0,0,0.8)";
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.font = "80px Arial";
        this.ctx.fillText("YOU DIED", this.width / 2, this.height / 2 - 40);
        this.ctx.font = "30px Arial";
        this.ctx.fillText(`Survived ${this.elapsedTime}s - Press R to Restart`, this.width / 2, this.height / 2 + 40);
    }

    animate(timestamp) {
       // Handle first frame edge case
    if (!this.lastTime) this.lastTime = timestamp;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(deltaTime); 
    
    // --- FIX: Pass timestamp to draw() so the UI timer works ---
    this.draw(timestamp); 
    
    requestAnimationFrame(this.animate);
    }
}