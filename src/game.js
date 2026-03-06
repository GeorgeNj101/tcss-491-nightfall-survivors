import Sprite from "./enemies/Sprite.js";
import Entity from "./enemies/Entity.js";
import XpOrb from "./XpOrb.js";
import Projectile from "./weapons/Projectile.js";
import Boss from "./enemies/Boss.js";
import Camera from "./Camera.js";
import LevelUp from "./LevelUp.js";
import Inventory from "./Inventory.js";
import HeartPickup from "./HeartPickup.js";
import Slash from "./weapons/Slash.js";
import ChickenEnemy from "./enemies/ChickenEnemy.js";
import DemonEnemy from "./enemies/DemonEnemy.js";
import FastChickenEnemy from "./enemies/FastChickenEnemy.js";

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.keys = {};
        this.enemies = [];
        this.bosses = [];
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
        this.invincibilityDuration = 500; // milliseconds

        // --- Player Stats ---
        this.player = new Sprite("assets/Main_Character.png");
        this.player.x = this.width / 2 - 64; 
        this.player.y = this.height / 2 - 64;
        this.slash = new Slash(this.player);
        this.camera = new Camera(this.width, this.height);
        this.playerTrail = [];
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
            projectile : 4,
            stamina: 100,      
            maxStamina: 100, 
            sprintCooldown: false,  
            isSprinting: false,
            damageMultiplier: 1
        };

        // --- Wave Logic ---
        this.wave = 1;
        this.waveEnemies = 5;
        this.waveBosses = 0;
        this.waveTimer = 60; // seconds
        this.waveStartTime = 0;
        this.waveEnemiesSpawned = false;
        this.bossSpawned = false;
        this.isWaveTransitioning = false;
        this.isWaveTransitioningDraw = false;
        this.waveTransitionStartTime = 0;
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
            // Force the key to lowercase so 'W' and 'w' are treated the same
            this.keys[e.key.toLowerCase()] = true; 
            
            if ((this.isDead || this.isVictory) && e.key.toLowerCase() === 'r') location.reload();

            if (e.key === " " && this.levelUpSystem && (this.levelUpSystem.isLevelingUp || this.levelUpSystem.waveLevelUp)) {
                this.levelUpSystem.closeLevelUpMenu();
                e.preventDefault(); 
            }
        });
        
        window.addEventListener("keyup", e => {
            this.keys[e.key.toLowerCase()] = false;
        });

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
                this.levelUpSystem.handleClick(mx, my, this.levelUpSystem.isLevelingUp);
            } else if (this.levelUpSystem && this.levelUpSystem.waveLevelUp) {
                this.levelUpSystem.handleClick(mx, my, this.levelUpSystem.waveLevelUp);
            }
            else {
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

        if (this.isWaveTransitioning) {
            
            if (this.levelUpSystem.waveLevelUp) {
                this.waveTransitionStartTime = timestamp;
                return; // Skip everything else until they choose a card
            }else {
                this.isWaveTransitioningDraw = true;

            }

            // 3. Normal countdown (Menu is closed, counting down to 5 seconds)
            if (timestamp - this.waveTransitionStartTime >= 5000) {
                this.isWaveTransitioning = false;
                this.gamePaused = false; // Ensure game unpauses
                this.isWaveTransitioningDraw = false; // Stop drawing transition screen
                // Reset timers for the fresh wave
                this.waveStartTime = timestamp;
                this.lastSecondTime = timestamp;
                
                //Check if any level ups were blocked during the transition 
                if (this.levelUpSystem.pendingLevelUps > 0) {
                    this.levelUpSystem.triggerLevelUpMenu();
                }
            }
            
            //return; // Skip normal combat/movement updates during the transition
        }
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
       // console.log(this.isWaveTransitioning)
    }

    updateTimers(timestamp) {
        if (timestamp - this.lastSecondTime >= 1000) {
            this.elapsedTime++;
            this.lastSecondTime = timestamp;
        }
        this.stats.attackTimer++;
    }

    handleWaveSystem(timestamp) {
        if (this.waveStartTime === 0) this.waveStartTime = timestamp;
        
        // Spawn Wave
        if (!this.waveEnemiesSpawned && !this.isWaveTransitioning) {
            for (let i = 0; i < this.waveEnemies; i++) {
                if (Math.random() < 0.4) {
                    this.enemies.push(new ChickenEnemy(this.camera));
                } else if (Math.random() > 0.9) {
                    this.enemies.push(new FastChickenEnemy(this.camera));
                } else {
                    this.enemies.push(new DemonEnemy(this.camera));
                }
            }
            if(this.wave > 2 && !this.bossSpawned && !this.isWaveTransitioning){
                for(let i = 0; i < this.waveBosses; i++){
                    this.bosses.push(new Boss(this.camera));
                    console.log("Spawning Boss for wave " + this.wave);
                }
            }

            this.waveBosses += 1;
            this.bossSpawned = true;
            this.waveEnemiesSpawned = true;
        }

        // Check Wave Completion
        const waveElapsed = (timestamp - this.waveStartTime) / 1000;
        if (waveElapsed >= this.waveTimer || ((this.enemies.length === 0 && this.waveEnemiesSpawned) && (this.bosses.length === 0 && this.bossSpawned))) {
            this.wave++;
            this.waveEnemies += 2 * this.wave; // Increase enemies per wave
            this.waveTimer = Math.max(30, this.waveTimer - 5);
            this.levelUpSystem.triggerWaveLevelUpMenu();
            this.isWaveTransitioning = true;
            this.waveTransitionStartTime = timestamp;
            this.waveEnemiesSpawned = false;
            this.bossSpawned = false;
        
           
        }

        // Spawn a boss after 10 waves have been completed
        // Spawn a boss after 10 waves have been completed
        if (this.wave > 2 && !this.bossSpawned) {
            console.log("Spawning Boss");
            this.enemies.push(new Boss(this.camera));
            this.bossSpawned = true;
        }
         
    }

    handleMovement() {
        let dx = 0, dy = 0;
        if (this.keys["w"] || this.keys["arrowUp"]) { dy = -1; this.player.direction = 3; }
        if (this.keys["s"] || this.keys["arrowDown"]) { dy = 1; this.player.direction = 0; }
        if (this.keys["a"] || this.keys["arrowLeft"]) { dx = -1; this.player.direction = 2; }
        if (this.keys["d"] || this.keys["arrowRight"]) { dx = 1; this.player.direction = 1; }
        // --- NEW SPRINT LOGIC ---
        this.stats.isSprinting = false;
        const isMoving = dx !== 0 || dy !== 0;

        if (this.keys["shift"] && this.stats.stamina > 0 && isMoving && !this.stats.sprintCooldown) {

            this.stats.speed = 7; // Double speed!
            this.stats.stamina -= 1; // Drain stamina
            if(this.stats.stamina <= 1) {
                this.stats.sprintCooldown = true;
            }
            this.stats.isSprinting = true;
            
            // Record position for the ghost trail every few frames
            if (this.gameFrame % 2 === 0) {
                this.playerTrail.push({
                    x: this.player.x,
                    y: this.player.y,
                    direction: this.player.direction,
                    frame: this.gameFrame,
                    alpha: 0.6 // Starting opacity of the ghost
                });
            }
        } else {
            this.stats.speed = 4; // Normal speed
            // Regenerate stamina if not sprinting
            if (this.stats.stamina < this.stats.maxStamina) {
                this.stats.stamina += 0.2; 
                if (this.stats.stamina >= 50) {
                    this.stats.sprintCooldown = false; // Reset cooldown once stamina is sufficiently regenerated
                }
            }
        }

        // Update and fade old trail pieces
        for (let i = this.playerTrail.length - 1; i >= 0; i--) {
            this.playerTrail[i].alpha -= 0.05; // Fade out
            if (this.playerTrail[i].alpha <= 0) {
                this.playerTrail.splice(i, 1); // Remove invisible ghosts
            }
        }
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
                this.enemies.forEach(enemy => {
                enemy.markedForDeletion = true;
                this.cheatLockedWave = true;
            });
            }
        } else {
            this.cheatLockedWave = false;
        }
        if (dx !== 0 || dy !== 0) {
            this.player.moving = true;

            const length = Math.hypot(dx, dy);
            dx /= length;
            dy /= length;
            
            this.player.x += dx * this.stats.speed;
            this.player.y += dy * this.stats.speed;

            this.camera.update(this.player);
        } else {
            this.player.moving = false;
        }
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
                    const dmg = p.damage * this.stats.damageMultiplier || 8;
                    console.log(`DEBUG: Projectile hit enemy for ${dmg} damage!`);
                    console.log(this.stats.damageMultiplier);
                    enemy.hp -= dmg;
                    p.markedForDeletion = true;
                    
                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        let orbCount = 0;
                        const isBoss = enemy.maxHp == 100;
                        const isDemon = enemy.maxHp == 30;
                        const isFastChicken = enemy.maxHp == 10;
                        const isChicken = enemy.maxHp == 15;
                        
                        if(isDemon) {
                            orbCount = 3;
                        }
                        else if(isFastChicken) {
                            orbCount = 2;
                        }
                        else if(isChicken) {
                            orbCount = 1;
                        }else if(isBoss) {
                            orbCount = 15;
                        }
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
                if(enemy.maxHp >= 100) {
                    enemy.knocked = this.gameFrame + 1;
                }

                if (enemy.hp <= 0) {
                    enemy.markedForDeletion = true;
                    const isBoss = enemy.maxHp >= 100;
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
                const isBoss = enemy.maxHp >= 100;
                if (isBoss) {
                    if (this.stats.hp > 0) this.processDamage(30);
                } else {
                    if (this.stats.hp > 0) this.processDamage(10);
                     enemy.markedForDeletion = true;
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
            console.log("DEBUG: Damage Ignored (Invincibility Frames)");
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
        if (this.currentWeapon && !this.isDead && !this.levelUpSystem.isLevelingUp && !this.levelUpSystem.waveLevelUp) {
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
        if(this.levelUpSystem.waveLevelUp) {
            this.levelUpSystem.drawWaveLevelUpMenu(this.ctx, this.width, this.height);
        }
        if (this.isWaveTransitioningDraw) {
           this.drawWaveTransitionScreen(timestamp);
            
        }
        }
        this.playerTrail.forEach(trail => {
            const screenX = trail.x - this.camera.x;
            const screenY = trail.y - this.camera.y;
            
            // Only draw if on screen (culling)
            if (screenX + this.player.frameWidth > -100 && screenX < this.width + 100 &&
                screenY + this.player.frameHeight > -100 && screenY < this.height + 100) {
                
                this.ctx.save();
                this.ctx.globalAlpha = trail.alpha; // Apply fade effect
                
                // Calculate the exact sprite frame the player was in
                const row = trail.direction * 2 + 1; // +1 because they were moving
                const col = trail.frame % this.player.cols;
                
                this.ctx.drawImage(
                    this.player.image,
                    col * this.player.frameWidth, row * this.player.frameHeight,
                    this.player.frameWidth, this.player.frameHeight,
                    screenX, screenY,
                    this.player.frameWidth, this.player.frameHeight
                );
                
                this.ctx.restore();
            }
        });
        
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
        // Inside game.js -> drawUI()


        this.drawBar(20, 20, 400, 40, this.stats.hp / this.stats.maxHp, "#740707", "#ef0000", `HP: ${Math.floor(this.stats.hp)} / ${this.stats.maxHp}`);
        // Use LevelUp system for XP bar
        this.levelUpSystem.drawXPBar(this.ctx, 20, 80,400, 40, this.stats.hp / this.stats.maxHp, "#ff4b1f", "#ff9068", `HP: ${Math.floor(this.stats.hp)} / ${this.stats.maxHp}`);
        
        const stamWidth = 500;
        const stamHeight = 50;
        const marginX = 40;
        const marginY = 40;
        const stamX = this.width - stamWidth - marginX;
        const stamY = this.height - stamHeight - marginY;

        this.drawStaminaBar(ctx, stamX, stamY, stamWidth, stamHeight, this.stats.stamina, this.stats.maxStamina);
        // Wave Info
        const waveElapsed = (timestamp - this.waveStartTime) / 1000;
        const waveRemaining = Math.max(0, this.waveTimer - waveElapsed);
        const waveMin = Math.floor(waveRemaining / 60);
        const waveSec = Math.floor(waveRemaining % 60);
        const waveFormatted = `${waveMin}:${waveSec.toString().padStart(2, '0')}`;

        ctx.fillStyle = "white";
        ctx.font = "40px arcadeclassic";

        ctx.textAlign = "left";
        ctx.fillText(`Time: ${Math.floor(this.elapsedTime / 60)}:${(this.elapsedTime % 60).toString().padStart(2, '0')}`, 450, 50);
  
        
        
        ctx.textAlign = "right";
        ctx.fillText(`Wave: ${this.wave}`, this.width - 20, 40);
        ctx.fillText(`Wave Timer: ${waveFormatted}`, this.width - 20, 80);
        ctx.fillText(`Enemies: ${this.enemies.length}`, this.width - 20, 120);
        ctx.fillText(`Bosses: ${this.bosses.length}`, this.width - 20, 160);
    }
    drawStaminaBar(ctx, x, y, width, height, current, max) {
        const percent = Math.max(0, current) / max;

        ctx.save();
        ctx.fillStyle = "rgba(10, 10, 20, 0.7)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 12); // 8px border radius
        ctx.fill();

        // Turn off shadow for the inner fill so it doesn't look muddy
        ctx.shadowBlur = 0; 
        ctx.shadowOffsetY = 0;

        // 2. Draw Gradient Fill (Cyan to Deep Blue)
        if (percent > 0) {
            const gradient = ctx.createLinearGradient(x, y, x + width, y);
            gradient.addColorStop(0, "#f4d289"); // Bright Cyan
            gradient.addColorStop(1, "#ffb700"); // Electric Blue

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, width * percent, height, 8);
            ctx.fill();
        }

        // 3. Draw Outer Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.stroke();

        // 4. Draw Crisp Text Label above the bar
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "right";
        ctx.fillText("STAMINA", x + width, y - 8);

        ctx.restore();
    }
    drawBar(x, y, width, height, percent, colorStart, colorEnd, label) {
        this.ctx.save();

        // 1. Draw Background (Dark translucent glass)
        this.ctx.fillStyle = "rgba(10, 10, 20, 0.7)";
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetY = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 8);
        this.ctx.fill();

        this.ctx.shadowBlur = 0; 
        this.ctx.shadowOffsetY = 0;

        // 2. Draw Gradient Fill
        if (percent > 0) {
            const gradient = this.ctx.createLinearGradient(x, y, x + width, y);
            gradient.addColorStop(0, colorStart);
            gradient.addColorStop(1, colorEnd);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, width * percent, height, 8);
            this.ctx.fill();
        }

        // 3. Draw Outer Border
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 8);
        this.ctx.stroke();

        // 4. Draw Centered Text Label
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        this.ctx.font = "bold 20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        
        // Add a subtle text shadow so the white text is readable over bright gradients
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(label, x + width / 2, y + height / 2 + 1);

        this.ctx.restore();
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

    drawWaveTransitionScreen(timestamp) {
        this.ctx.save();

        const elapsed = timestamp - this.waveTransitionStartTime; 
        
        // Subtract elapsed from total pause time (5000ms), divide by 1000 for seconds, and round up
        let remainingSeconds = Math.ceil((5000 - elapsed) / 1000); 
        
        // Safety clamp just in case of frame hitches
        if (remainingSeconds < 1) remainingSeconds = 1; 
        if (remainingSeconds > 5) remainingSeconds = 5;

        // 2. Darken the background slightly so the text pops
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 3. Draw the glowing "WAVE X" text (Shifted up slightly)
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        
        this.ctx.shadowColor = "rgba(255, 183, 0, 0.8)"; // Golden glow
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = "#ffb700"; // Golden text
        this.ctx.font = "bold 80px arcadeclassic, Arial"; 
        
        this.ctx.fillText(`WAVE ${this.wave}`, this.width / 2, this.height / 4 - 50);
        
        // 4. Draw the "Get Ready..." subtitle
        this.ctx.shadowBlur = 0; // Turn off extreme glow for the subtitle
        this.ctx.shadowColor = "rgba(0,0,0,0.8)"; // Subtle black drop shadow
        this.ctx.shadowBlur = 4;
        
        this.ctx.fillStyle = "white";
        this.ctx.font = "30px arcadeclassic, Arial";
        this.ctx.fillText("Get Ready...", this.width / 2, this.height / 4 + 20);

        // 5. Draw the large visual countdown
        this.ctx.fillStyle = "#00f2fe"; // Bright Cyan to match your stamina bar
        this.ctx.font = "bold 70px arcadeclassic, Arial";
        this.ctx.fillText(remainingSeconds.toString(), this.width / 2, this.height / 4 + 90);

        this.ctx.restore();
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

    getWave() {
        return this.wave;   
    }
}