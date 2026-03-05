import Sprite from "./Sprite.js";
import Entity from "./Entity.js";
import XpOrb from "./XpOrb.js";
import Projectile from "./Projectile.js";
import Boss from "./Boss.js";
import Camera from "./Camera.js";
import LevelUp from "./LevelUp.js";
import Inventory from "./Inventory.js";
import HeartPickup from "./HeartPickup.js";
import Slash from "./Slash.js";

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.keys = {};
        this.enemies = [];
        this.xpOrbs = [];
        this.HeartPickups = [];
        this.projectiles = [];
        this.gameFrame = 0;
        this.fps = 6;
        this.frameTime = 1000/this.fps;
        this.isDead = false;
        this.isVictory = false; // New flag for boss kill victory
        this.elapsedTime = 0;
        this.lastSecondTime = 0;
        this.lastTime = 0;
        this.lastDrawTime = 0;
        this.score = 0;
        this.gamePaused = false; // For level up menu
        this.pauseStartTime = 0; // Track when pause started
        this.totalPauseTime = 0; // Track total time paused

        //FOR CHEATS/DEBUGGING
        this.cheatLocked = false;
        this.cheatLockedWave = false;

        // --- Invincibility Frames ---
        this.lastDamageTime = 0;
        this.invincibilityDuration = 1000; // milliseconds

        // --- Player Stats ---
        this.player = new Sprite("assets/Main_Character.png");
        this.player.x = this.width / 2 - 64; 
        this.player.y = this.height / 2 - 64;
        this.slash = new Slash(this.player);
        this.camera = new Camera(this.width, this.height);

        this.stats = {
            hp: 100,
            maxHp: 100,
            xp: 0,
            maxXp: 5,//changed temperoarily for testing
            level: 1,
            speed: 4,
            attackCooldown: 180,
            attackTimer: 0,
            hpRegen : 0,
            defense : 0,
            projectile : 4
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
        this.tileSize = 200;
        this.grassImage = new Image();
        this.grassImage.src = "assets/Grass.png";
        //more images homoe screen
        this.titleBackgroundImage = new Image();
        this.titleBackgroundImage.src = "assets/Title.png";
        this.startImage = new Image();
        this.startImage.src = "assets/start.png";
        this.howtoplayimage = new Image();
        this.howtoplayimage.src = "assets/howtoplay.png";
        this.creditsimage = new Image();
        this.creditsimage.src = "assets/credits.png";
        // --- Inventory ---
        this.inventory = new Inventory(this);

        // --- Weapon ---
        this.currentWeapon = null;
        this.lastShotTime = 0; // timestamp of last weapon shot

        // --- Level Up System ---
        this.levelUpSystem = new LevelUp(this.stats, this);

        // --- Mouse tracking ---
        this.mouse = { x: 0, y: 0, down: false };

        this.init();
    }

    init() {
        window.addEventListener("keydown", e => {
            this.keys[e.key] = true;
            if ((this.isDead || this.isVictory) && e.key.toLowerCase() === 'r') location.reload();

            // Handle SPACE key to close level up menu
            if (e.key === " " && this.levelUpSystem && this.levelUpSystem.isLevelingUp) {
                this.levelUpSystem.closeLevelUpMenu();
                e.preventDefault(); // Prevent page scroll
            }
        });
        window.addEventListener("keyup", e => this.keys[e.key] = false);

        // Mouse tracking — use window-level events so it works while keys are held
        window.addEventListener("mousemove", e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        window.addEventListener("mousedown", e => {
            if (e.button === 0) this.mouse.down = true;
        });
        window.addEventListener("mouseup", e => {
            if (e.button === 0) this.mouse.down = false;
        });
        this.canvas.addEventListener("click", e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            if (this.levelUpSystem && this.levelUpSystem.isLevelingUp) {
                this.levelUpSystem.handleClick(mx, my);
            } else {
                // Check inventory clicks
                this.inventory.handleClick(mx, my);
            }
        });
        // Prevent right-click context menu on canvas
        this.canvas.addEventListener("contextmenu", e => e.preventDefault());

        this.animate = this.animate.bind(this);
        // UI state: 'title' | 'controls' | 'playing'
        this.screen = 'title';

        // Add click handler for title/controls buttons
        this.canvas.addEventListener('click', e => this.handleClick(e));

        requestAnimationFrame(this.animate);
    }

    update(timestamp) {
        if (this.isDead || this.isVictory) return;

        // Only run game updates when playing
        if (this.screen !== 'playing') return;

        // Don't update game logic if paused (level up menu)
        if (!this.gamePaused) {
            this.gameFrame = Math.floor(timestamp/this.frameTime)
            this.updateTimers(timestamp);
            this.handleWaveSystem(timestamp);
            this.handleMovement();
            this.handleCombat();
            this.handlePickupCollection();

            if (this.stats.hp <= 0) {
                this.isDead = true;
                this.stats.hp = 0;
            }
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
        this.levelActivation = false;
       
        if (this.keys["x"]) {
            // Only run if NOT locked
            if (!this.cheatLocked) {
                this.levelUpSystem.addXP(this.levelUpSystem.getMaxXp()); // Instantly level up
                console.log("DEBUG: Level Up (Cheat)");
                this.cheatLocked = true; // Lock it immediately
            }
        } else {
   
            this.cheatLocked = false;
        }

        if (this.keys["z"]) {   
            if(!this.cheatLockedWave) {
                this.wave++; // Jump to wave 10
                console.log("DEBUG: Skip Wave (Cheat)");
                this.cheatLockedWave = true;
            }
        } else {
            this.cheatLockedWave = false;
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

        this.stats.hp+=this.stats.hpRegen
        this.stats.hp = Math.min(this.stats.hp,this.stats.maxHp)

        const spawnX = this.player.x + this.player.frameWidth / 2 - 16;
        const spawnY = this.player.y + this.player.frameHeight / 2 - 16;

        // --- WEAPON SHOOTING (mouse-aimed, only when weapon equipped) ---
        if (this.currentWeapon && this.mouse.down) {
            const wStats = this.currentWeapon.stats || {};
            const fireRate = wStats.fireRate || 1; // shots per second
            const cooldownMs = 1000 / fireRate;
            const now = performance.now();

            if (now - this.lastShotTime >= cooldownMs) {
                this.lastShotTime = now;

                // Convert screen mouse → world position
                const worldMX = this.mouse.x + this.camera.x;
                const worldMY = this.mouse.y + this.camera.y;

                // Direction from player center to mouse world pos
                const dx = worldMX - (this.player.x + this.player.frameWidth / 2);
                const dy = worldMY - (this.player.y + this.player.frameHeight / 2);
                const len = Math.hypot(dx, dy) || 1;

                this.projectiles.push(new Projectile(spawnX, spawnY, dx / len, dy / len, wStats));
            }
        }

        //firebalal attack
        if (this.stats.attackTimer >= this.stats.attackCooldown && this.stats.projectile === 4) {
            const directions = [
                { x: 1, y: -1 }, { x: 1, y: 1 },
                { x: -1, y: 1 }, { x: -1, y: -1 }
            ];
            directions.forEach(dir => {
                const len = Math.hypot(dir.x, dir.y);
                this.projectiles.push(new Projectile(spawnX, spawnY, dir.x / len, dir.y / len));
            });
            this.stats.attackTimer = 0;
        } else if (this.stats.attackTimer >= this.stats.attackCooldown && this.stats.projectile === 8) {
            const directions = [
                { x: 1, y: 0 }, { x: -1, y: 0 },
                { x: 0, y: 1 }, { x: 0, y: -1 },
                { x: 1, y: -1 }, { x: 1, y: 1 },
                { x: -1, y: 1 }, { x: -1, y: -1 }
            ];
            directions.forEach(dir => {
                const len = Math.hypot(dir.x, dir.y);
                this.projectiles.push(new Projectile(spawnX, spawnY, dir.x / len, dir.y / len));
            });
            this.stats.attackTimer = 0;
        } else if (this.stats.attackTimer >= this.stats.attackCooldown && this.stats.projectile === 12) {
            const directions = [ 
                { x: 1, y: 0 }, { x: -1, y: 0 },
                { x: 0, y: 1 }, { x: 0, y: -1 },
                { x: 1, y: -1 }, { x: 1, y: 1 },
                { x: -1, y: 1 }, { x: -1, y: -1 },
                { x: .5, y: -0.95  }, { x: 0.95, y: -0.5 },
                { x: 0.95, y: 0.5 }, { x: 0.5, y: 0.95 },
                { x: -0.5, y: 0.95 }, { x: -0.95, y: 0.5 },
                { x: -0.95, y: -0.5 }, { x: -0.5, y: -0.95 }
                
                
            
            ];
            directions.forEach(dir => {
                const len = Math.hypot(dir.x, dir.y);
                this.projectiles.push(new Projectile(spawnX, spawnY, dir.x / len, dir.y / len));
            });
            this.stats.attackTimer = 0;
        }

        // 1. Update projectiles & check collisions with enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update();
            if (p.fromEnemy) {
                // Enemy projectile: Check collision against the player
                if (p.collidesWith(this.player)) {
                    this.processDamage(p.damage || 15);
                    p.markedForDeletion = true;
                }
            }else {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (enemy.markedForDeletion) continue;
                
                if (p.collidesWith(enemy)) {
                    const dmg = p.damage || 10;
                    enemy.hp -= dmg;
                    p.markedForDeletion = true;
                    
                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        const isBoss = enemy.maxHp > 100;
                        const orbCount = isBoss ? 8 : 1;
                        for (let k = 0; k < orbCount; k++) {
                            this.xpOrbs.push(new XpOrb(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                            if (Math.random() < 1/3) {
                                this.HeartPickups.push(new HeartPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                            }
                        }
                        this.score += isBoss ? 250 : 10;
                    }
                    break;
                }

            }
            }
        }

        // 2. Enemy movement + player collision
        this.enemies.forEach(enemy => {

            if (this.slash.collidesWith(enemy) && !enemy.markedForDeletion) {
                enemy.lastMeleeHit = this.gameFrame
                const dmg = this.slash.damage;
                enemy.hp -= dmg;
                if(enemy.maxHp <= 100) {
                    enemy.knocked = this.gameFrame + 1;
                }

                if (enemy.hp <= 0) {
                    enemy.markedForDeletion = true;
                    const isBoss = enemy.maxHp > 100;
                    const orbCount = isBoss ? 8 : 1;
                    for (let k = 0; k < orbCount; k++) {
                        this.xpOrbs.push(new XpOrb(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                        if (Math.random() < 1 / 3) {
                            this.HeartPickups.push(new HeartPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                        }
                    }
                    this.score += isBoss ? 250 : 10;
                }
            }

            enemy.update(this.player.x, this.player.y, this);
            if (this.player.collidesWith(enemy)) {
                const isBoss = enemy.maxHp > 100;
                if (isBoss) {
                    if (this.stats.hp > 0) this.processDamage(30);
                } else {
                    if (this.stats.hp > 0) this.processDamage(10);
                    // enemy.markedForDeletion = true;
                    // this.xpOrbs.push(new XpOrb(enemy.x, enemy.y));
                    // this.score += 10;
                }
            }
        });
        
        // 3. Filter out dead objects
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
    }

    processDamage(damage) {
        const now = performance.now();
        if (now - this.lastDamageTime < this.invincibilityDuration) {
            return; // Still invincible
        }
        this.lastDamageTime = now;
        this.stats.hp -= Math.max(1, damage - this.stats.defense / 2);
    }

    handlePickupCollection() {
        this.xpOrbs.forEach(orb => {
            const dist = orb.getDistance(this.player);
            if (dist < 150) { // Magnet range
                const moveX = (this.player.centerX() - orb.centerX()) * 0.1;
                const moveY = (this.player.centerY() - orb.centerY()) * 0.1;
                orb.x += moveX;
                orb.y += moveY;
            }
            if (this.player.collidesWith(orb)) {
                orb.markedForDeletion = true;
                console.log("DEBUG: Orb Collected!");
                this.levelUpSystem.addXP(1); // Use LevelUp system
            }
        });

        this.HeartPickups.forEach(heart => {
            const dist = heart.getDistance(this.player);
            if (dist < 150) { // Magnet range
                const moveX = (this.player.centerX() - heart.centerX()) * 0.1;
                const moveY = (this.player.centerY() - heart.centerY()) * 0.1;
                heart.x += moveX;
                heart.y += moveY;
            }
            if (this.player.collidesWith(heart)) {
                heart.markedForDeletion = true;
                console.log("DEBUG: Heart Collected!");
                this.stats.hp += 10;
                this.stats.hp = Math.min(this.stats.hp,this.stats.maxHp)
            }
        });

        this.xpOrbs = this.xpOrbs.filter(o => !o.markedForDeletion);
        this.HeartPickups = this.HeartPickups.filter(o => !o.markedForDeletion);
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

        {
            this.lastDrawTime = timestamp;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();

        // If we're on title or controls screens, show those and skip game rendering
        if (this.screen === 'title') {
            this.drawTitleScreen(timestamp);
            return;
        }
        if (this.screen === 'controls') {
            this.drawControlsScreen(timestamp);
            return;
        }
        if (this.screen === 'credits') {
            this.drawCreditsScreen(timestamp);
            return;
        }

        const renderList = [this.player,
            this.slash,
            ...this.enemies, ...this.xpOrbs, ...this.HeartPickups, ...this.projectiles];
        this.slash.updateDirection()
        renderList.sort((a, b) => (a.y + a.frameHeight) - (b.y + b.frameHeight));

        renderList.forEach(obj => {
            // Convert World Position -> Screen Position
            const screenX = obj.x - this.camera.x;
            const screenY = obj.y - this.camera.y;

            // Optimization: Only draw if visible on screen (Culling)
            // Add a buffer (e.g., 100px) so sprites don't pop out at edges
            if (obj.isRotated===true||(
                screenX + obj.frameWidth > -100 &&
                screenX < this.width + 100 &&
                screenY + obj.frameHeight > -100 &&
                screenY < this.height + 100)
            ) {
                obj.draw(this.ctx, this.gameFrame, screenX, screenY);
            }
        });

        this.drawUI(timestamp);
        this.inventory.drawInventory();

        // Draw crosshair when weapon equipped
        if (this.currentWeapon && !this.isDead && !this.levelUpSystem.isLevelingUp) {
            this.drawCrosshair();
        }

        if (this.isDead) {
            this.drawDeathScreen();
        } else if (this.isVictory) {
            this.drawVictoryScreen();
        }

        // Draw level up menu if active
        if (this.levelUpSystem.isLevelingUp) {
            this.levelUpSystem.drawLevelUpMenu(this.ctx, this.width, this.height);
        }
        }
    }

    drawBackground() {
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

        // Use LevelUp system for XP bar
        this.levelUpSystem.drawXPBar(ctx, 20, 50, 200, 20);
        
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
        ctx.fillText(`Level: ${this.stats.level}`, 240, 70);
        
        
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

    drawCrosshair() {
        const ctx = this.ctx;
        const mx = this.mouse.x;
        const my = this.mouse.y;
        const size = 12;
        const gap = 4;

        ctx.save();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        // Top line
        ctx.beginPath();
        ctx.moveTo(mx, my - gap);
        ctx.lineTo(mx, my - gap - size);
        ctx.stroke();
        // Bottom line
        ctx.beginPath();
        ctx.moveTo(mx, my + gap);
        ctx.lineTo(mx, my + gap + size);
        ctx.stroke();
        // Left line
        ctx.beginPath();
        ctx.moveTo(mx - gap, my);
        ctx.lineTo(mx - gap - size, my);
        ctx.stroke();
        // Right line
        ctx.beginPath();
        ctx.moveTo(mx + gap, my);
        ctx.lineTo(mx + gap + size, my);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
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

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const bw = 300, bh = 120;
        const bx = (this.width - bw) / 2;
        const startY = this.height / 2;
        const howToPlayY = startY + 150;
        const creditsY = howToPlayY + 150;

        if (this.screen === 'title') {
            // Start Button
            if (x >= bx && x <= bx + bw && y >= startY && y <= startY + bh) {
                this.startGame();
                return;
            }
            // Controls Button
            if (x >= bx && x <= bx + bw && y >= howToPlayY && y <= howToPlayY + bh) {
                this.screen = 'controls';
                return;
            }
            // Credits Button
            if (x >= bx && x <= bx + bw && y >= creditsY && y <= creditsY + bh) {
                this.screen = 'credits';
                return;
            }
        } else if (this.screen === 'controls') {
            // Back button at bottom
            const backY = this.height - 120;
            if (x >= bx && x <= bx + bw && y >= backY && y <= backY + bh) {
                this.screen = 'title';
                return;
            }
        } else if (this.screen === 'credits') {
            const backY = this.height - 120;
            if (x >= bx && x <= bx + bw && y >= backY && y <= backY + bh) {
                this.screen = 'title';
                return;
            }
        }
    }

    startGame() {
        this.screen = 'playing';
        // reset timers so the wave/timer logic starts fresh
        this.lastSecondTime = 0;
        this.lastTime = 0;
        this.elapsedTime = 0;
        this.waveStartTime = 0;
    }

    drawTitleScreen(timestamp) {
        if (this.titleBackgroundImage.complete) {
            // Stretches the image to fit the entire canvas
            this.ctx.drawImage(this.titleBackgroundImage, 0, 0, this.width, this.height);
            // this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; 
            // this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            // Fallback to solid black if the image hasn't loaded yet
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        // Title
       
        this.ctx.textAlign = 'center';
        this.ctx.font = '72px Arial';
        

        // Buttons
        const bw = 300, bh = 120; // Keep these the same, they dictate your click hitboxes!
        const bx = (this.width - bw) / 2;
        const startY = this.height / 2;
        const howToPlayY = startY + 150;
        const creditsY = howToPlayY + 150;

        // Draw Start Button Image
        if (this.startImage.complete) {
            this.ctx.drawImage(this.startImage, bx, startY, bw, bh);
         
        }

        // Draw Controls Button Image
        if (this.howtoplayimage.complete) {
            this.ctx.drawImage(this.howtoplayimage, bx, howToPlayY, bw, bh);
           
        }

        // Draw Credits Button Image
        if (this.creditsimage.complete) {
            this.ctx.drawImage(this.creditsimage, bx, creditsY, bw, bh);
          
        }


    }

    drawControlsScreen() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = '48px Arial';
        this.ctx.fillText('Controls', this.width / 2, 80);

        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        const left = 80;
        let y = 140;
        const lineH = 30;
        this.ctx.fillText('- Move: W A S D or Arrow Keys', left, y); y += lineH;
        this.ctx.fillText('- Sprint: Hold Shift', left, y); y += lineH;
        this.ctx.fillText('- Auto-attack: Projectiles fire periodically', left, y); y += lineH;
        this.ctx.fillText('- Objective: Survive as long as possible', left, y); y += lineH;
        this.ctx.fillText('  Kill enemies to collect XP orbs to level up, get stronger, and eventually beat the boss.', left, y); y += lineH * 2;

        // Back button
        const bw = 300, bh = 60;
        const bx = (this.width - bw) / 2;
        const backY = this.height - 120;
        this.ctx.fillStyle = '#007acc';
        this.ctx.fillRect(bx, backY, bw, bh);
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = '26px Arial';
        this.ctx.fillText('Back', this.width / 2, backY + 40);
    }

    drawCreditsScreen() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = '48px Arial';
        this.ctx.fillText('Credits', this.width / 2, 80);

        this.ctx.font = '22px Arial';
        this.ctx.textAlign = 'center';
        const names = 'Created by Carson Poirier, Ibrahim Elnikety, Thien-An Tran, and Geroge Njane.';
        this.ctx.fillText(names, this.width / 2, this.height / 2);

        // Back button
        const bw = 300, bh = 60;
        const bx = (this.width - bw) / 2;
        const backY = this.height - 120;
        this.ctx.fillStyle = '#007acc';
        this.ctx.fillRect(bx, backY, bw, bh);
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = '26px Arial';
        this.ctx.fillText('Back', this.width / 2, backY + 40);
    }

    animate(timestamp) {
       // Handle first frame edge case
    if (!this.lastTime) this.lastTime = timestamp;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(timestamp); // Pass timestamp, not deltaTime

    // --- FIX: Pass timestamp to draw() so the UI timer works ---
    this.draw(timestamp);
    requestAnimationFrame(this.animate);
    }

    // show victory overlay
    drawVictoryScreen() {
        this.ctx.fillStyle = "rgba(0,0,0,0.8)";
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "gold";
        this.ctx.textAlign = "center";
        this.ctx.font = "80px Arial";
        this.ctx.fillText("YOU WIN!", this.width / 2, this.height / 2 - 40);
        this.ctx.font = "30px Arial";
        this.ctx.fillText(`Survived ${this.elapsedTime}s - Press R to Restart`, this.width / 2, this.height / 2 + 40);
    }
}