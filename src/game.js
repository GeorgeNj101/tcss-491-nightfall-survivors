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
import Forcefield from "./Forcefield.js";
import ForcefieldPickup from "./ForcefieldPickup.js";
import ChickenEnemy from "./enemies/ChickenEnemy.js";
import DemonEnemy from "./enemies/DemonEnemy.js";
import FastChickenEnemy from "./enemies/FastChickenEnemy.js";
import ChickenBoss from "./enemies/ChickenBoss.js";

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
        this.forcefieldPickups = [];
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
        this.manualPause = false; // Player-toggled pause (Escape)
        this.pauseStartTime = 0; // Track when pause started
        this.totalPauseTime = 0; // Track total time paused

        //FOR CHEATS/DEBUGGING
        this.cheatLocked = false;
        this.cheatLockedWave = false;

        // --- Invincibility Frames ---
        this.lastDamageTime = 0;
        this.invincibilityDuration = 300; 

        // --- Player Stats ---
        this.player = new Sprite("assets/Main_Character.png");
        this.player.x = this.width / 2 - 64; 
        this.player.y = this.height / 2 - 64;
        this.slash = new Slash(this.player);
        this.camera = new Camera(this.width, this.height);
        this.playerTrail = [];
        this.player.kbX = 0; 
        this.player.kbY = 0;
        this.stats = {
            hp: 100,
            maxHp: 100,
            xp: 0,
            maxXp: 5,//changed temperoarily for testing
            level: 1,
            baseSpeed: 4,        // permanent speed (upgraded by cards)
            speed: 4,            // effective speed each frame (base or sprint)
            sprintMultiplier: 1.75, // how much faster sprint is
            attackCooldown: 180,
            attackTimer: 0,
            hpRegen : 0,
            defense : 0,
            projectile : 4,
            stamina: 100,
            maxStamina: 100,
            staminaRegen: 0.2,
            sprintCooldown: false,
            isSprinting: false,
            damageMultiplier: 1

        };

        // --- Wave Logic ---
        this.wave = 1;
        this.waveEnemies = 5;
        this.waveBosses = 1;
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

        // --- Forcefield ---
        this.forcefield = null; // Defensive item that absorbs 3 hits

        // --- Level Up System ---
        this.levelUpSystem = new LevelUp(this.stats, this);

        // --- Mouse tracking ---
        this.mouse = { x: 0, y: 0, down: false };

        this.init();
    }

    init() {
        // Keys that should be prevented from scrolling the page
        const preventKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "escape"];

        window.addEventListener("keydown", e => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            // Prevent arrow keys and space from scrolling the page
            if (preventKeys.includes(key)) e.preventDefault();

            if ((this.isDead || this.isVictory) && key === 'r') location.reload();

            if (key === " " && this.levelUpSystem && (this.levelUpSystem.isLevelingUp || this.levelUpSystem.waveLevelUp)) {
                this.levelUpSystem.closeLevelUpMenu();
            }

            // Pause/Resume with Escape (only during gameplay, not in menus)
            if (key === "escape" && this.screen === 'playing' && !this.isDead && !this.isVictory) {
                // Don't toggle pause if a level-up or wave menu is open
                if (this.levelUpSystem && (this.levelUpSystem.isLevelingUp || this.levelUpSystem.waveLevelUp)) return;
                if (this.isWaveTransitioning) return;

                this.manualPause = !this.manualPause;
                this.gamePaused = this.manualPause;
                if (this.manualPause) {
                    this.pauseStartTime = performance.now();
                } else {
                    const pausedFor = performance.now() - this.pauseStartTime;
                    this.totalPauseTime += pausedFor;
                    // Push wave timer forward so pause time doesn't count
                    this.waveStartTime += pausedFor;
                    // Push the shield timer forward so pause time doesn't count
                    if (this.forcefield && this.forcefield.isStillActive()) {
                        this.forcefield.createdAt += pausedFor;
                    }
                }
            }

            // Inventory hotkeys (1-5) to equip/use items directly
            const isInventoryHotkey = !Number.isNaN(parseInt(key, 10)) && key.length === 1;
            const isLevelUpOpen = this.levelUpSystem && (this.levelUpSystem.isLevelingUp || this.levelUpSystem.waveLevelUp);
            if (this.screen === 'playing' && !this.isDead && !this.isVictory && !this.gamePaused && !isLevelUpOpen && !this.isWaveTransitioning && isInventoryHotkey) {
                const slot = parseInt(key, 10) - 1;
                if (slot >= 0 && slot < this.inventory.maxSlots) {
                    this.inventory.selectItem(slot);
                }
            }
        });

        window.addEventListener("keyup", e => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Clear all keys when window loses focus (prevents stuck keys from drag/alt-tab)
        window.addEventListener("blur", () => {
            this.keys = {};
        });

        // Mouse tracking — use window-level for mousemove so it works while keys are held
        window.addEventListener("mousemove", e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        // mousedown/mouseup on canvas only (not window) to avoid capturing outside clicks
        this.canvas.addEventListener("mousedown", e => {
            e.preventDefault(); // Prevent drag-select which steals focus and causes stuck keys

            // Skip weapon-fire logic when a menu overlay is active
            // (otherwise preventDefault + mouse.down can swallow or interfere with the click event)
            if (this.levelUpSystem &&
                (this.levelUpSystem.isLevelingUp || this.levelUpSystem.waveLevelUp)) {
                return;
            }

            if (e.button === 0) {
                // Don't set mouse.down if clicking on inventory (prevents weapon fire on UI click)
                const slot = this.inventory.getSlotAt(this.mouse.x, this.mouse.y);
                if (slot >= 0) return; // Let the click handler deal with it
                this.mouse.down = true;
            }
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
            
            //return; 
        }
        // Don't update game logic if paused (level up menu)
        if (!this.gamePaused) {
            this.gameFrame = Math.floor(timestamp/this.frameTime)
            this.updateTimers(timestamp);
            this.handleWaveSystem(timestamp);
            this.handleMovement();
            this.handleCombat();
            this.handlePickupCollection();

            // Clean up expired forcefield
            if (this.forcefield && !this.forcefield.isStillActive()) {
                console.log("DEBUG: Shield expired!");
                this.forcefield = null;
            }

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
        if (this.isWaveTransitioning) return;
        if (this.waveStartTime === 0) this.waveStartTime = timestamp;
        
        // Spawn Wave
        if (!this.waveEnemiesSpawned) {
            for (let i = 0; i < this.waveEnemies; i++) {
                if (Math.random() < 0.4) {
                    this.enemies.push(new ChickenEnemy(this.camera));
                } else if (Math.random() > 0.9) {
                    this.enemies.push(new FastChickenEnemy(this.camera));
                } else {
                    this.enemies.push(new DemonEnemy(this.camera));
                }
            }
            if(this.wave > 0 && !this.bossSpawned){
                for(let i = 0; i < this.waveBosses; i++){
                    this.bosses.push(new Boss(this.camera));
                   
                }
                console.log("Spawning Boss for wave " + this.wave);
                for(let i = 0; i < this.waveBosses * 3; i++){
                    this.bosses.push(new ChickenBoss(this.camera));

                }
                console.log("Spawning Boss for wave " + this.wave);
            }
            
          
            this.bossSpawned = true;
            this.waveEnemiesSpawned = true;
        }

        // Check Wave Completion
        const waveElapsed = (timestamp - this.waveStartTime) / 1000;
        if (waveElapsed >= this.waveTimer || ((this.enemies.length === 0 && this.waveEnemiesSpawned) && (this.bosses.length === 0 && this.bossSpawned))) {
            this.wave++;
            this.waveEnemies += 2 * this.wave;
            this.waveBosses = this.wave; // Increase enemies per wave
            this.waveTimer = Math.max(30, this.waveTimer - 5);

            // Every 3rd wave: full upgrade menu. Other waves: instant small reward.
            if (this.wave % 3 === 0) {
                this.levelUpSystem.triggerWaveLevelUpMenu();
            } else {
                // Small reward: heal 25% of max HP + bonus XP
                const healAmount = Math.floor(this.stats.maxHp * 0.25);
                this.stats.hp = Math.min(this.stats.hp + healAmount, this.stats.maxHp);
                this.levelUpSystem.addXP(3);
                this.waveRewardText = `+${healAmount} HP  &  +3 XP`;
                this.waveRewardTime = timestamp;
            }

            this.isWaveTransitioning = true;
            this.waveTransitionStartTime = timestamp;
            this.waveEnemiesSpawned = false;
            this.bossSpawned = false;
        }
         
    }

    handleMovement() {
        let dx = 0, dy = 0;
        if (this.keys["w"] || this.keys["arrowup"]) { dy = -1; this.player.direction = 3; }
        if (this.keys["s"] || this.keys["arrowdown"]) { dy = 1; this.player.direction = 0; }
        if (this.keys["a"] || this.keys["arrowleft"]) { dx = -1; this.player.direction = 2; }
        if (this.keys["d"] || this.keys["arrowright"]) { dx = 1; this.player.direction = 1; }
        // --- NEW SPRINT LOGIC ---
        this.stats.isSprinting = false;
        const isMoving = dx !== 0 || dy !== 0;

        if (this.keys["shift"] && this.stats.stamina > 0 && isMoving && !this.stats.sprintCooldown) {

            this.stats.speed = this.stats.baseSpeed * this.stats.sprintMultiplier;
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
            this.stats.speed = this.stats.baseSpeed; // Use baseSpeed (respects upgrades)
            // Regenerate stamina if not sprinting
            if (this.stats.stamina < this.stats.maxStamina) {
                this.stats.stamina += this.stats.staminaRegen;
                if (this.stats.stamina >= 30) {
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
                this.levelUpSystem.addXP(Math.floor(3 + Math.pow(2, this.stats.level - 1))); // Instantly level up
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
        
            });
                this.bosses.forEach(boss => {
                boss.markedForDeletion = true;
              
            });
                this.cheatLockedWave = true;
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

        this.player.x += this.player.kbX;
        this.player.y += this.player.kbY;

        // Apply friction to slow the knockback down smoothly (0.85 = 15% slowdown per frame)
        this.player.kbX *= 0.85;
        this.player.kbY *= 0.85;

        // Stop the math once the slide is basically over to prevent floating point drift
        if (Math.abs(this.player.kbX) < 0.1) this.player.kbX = 0;
        if (Math.abs(this.player.kbY) < 0.1) this.player.kbY = 0;

        // Ensure the camera follows the player even while they are being knocked back
        this.camera.update(this.player);
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
                        }
                        for (let k = 0; k < orbCount; k++) {
                            this.xpOrbs.push(new XpOrb(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                            
                        }
                        if (Math.random() < 1/3) {
                                this.HeartPickups.push(new HeartPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                            }
                        // Forcefield pickup drop (7% chance)
                        if (Math.random() < 0.07) {
                            this.forcefieldPickups.push(new ForcefieldPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                        }
                    }
                    break;
                }

            }
            //boss collisions
            for (let j = this.bosses.length - 1; j >= 0; j--) {
                const enemy = this.bosses[j];
                if (enemy.markedForDeletion) continue;
                
                if (p.collidesWith(enemy)) {
                    const dmg = p.damage * this.stats.damageMultiplier || 8;
                    console.log(`DEBUG: Projectile hit boss for ${dmg} damage!`);
                    console.log(this.stats.damageMultiplier);
                    enemy.hp -= dmg;
                    p.markedForDeletion = true;
                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        let orbCount = 0;
                        const isDemonBoss = enemy.maxHp == 100;
                        if(isDemonBoss) {
                            orbCount = 15;
                        }
                        for (let k = 0; k < orbCount; k++) {
                            this.xpOrbs.push(new XpOrb(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                            
                        }
                        if (Math.random() < 1/2) {
                                this.HeartPickups.push(new HeartPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                        }
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

                if (enemy.hp <= 0) {
                    enemy.markedForDeletion = true;
                    const orbCount = 1;
                    for (let k = 0; k < orbCount; k++) {
                        this.xpOrbs.push(new XpOrb(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                        if (Math.random() < 1 / 3) {
                            this.HeartPickups.push(new HeartPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                        }
                    }
                }
            }
            enemy.update(this.player.x, this.player.y, this);
            if (this.player.collidesWith(enemy)) {
                    enemy.markedForDeletion = true; 
                    this.processDamage(enemy.damage || 10); 
                    enemy.markedForDeletion = true;
                    this.xpOrbs.push(new XpOrb(enemy.x, enemy.y));
                    if (Math.random() < 0.07) {
                        this.forcefieldPickups.push(new ForcefieldPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40));
                        console.log("DEBUG: Forcefield dropped from player collision! Total forcefields:", this.forcefieldPickups.length);
                    }
            }
           
            
        });
        this.bosses.forEach(boss => {
            
            if (this.slash.collidesWith(boss) && !boss.markedForDeletion) {
                boss.lastMeleeHit = this.gameFrame;
                boss.hp -= this.slash.damage;

                if (boss.hp <= 0) {
                    boss.markedForDeletion = true;
                    // Spawn a massive explosion of XP and a potential heart
                    for (let k = 0; k < 15; k++) {
                        this.xpOrbs.push(new XpOrb(boss.x + (Math.random() - 0.5) * 40, boss.y + (Math.random() - 0.5) * 40));
                    }
                    if (Math.random() < 0.5) {
                        this.HeartPickups.push(new HeartPickup(boss.x + (Math.random() - 0.5) * 40, boss.y + (Math.random() - 0.5) * 40));
                    }
                }
            }

            // 2. Make the boss actually chase the player!
            boss.update(this.player.x, this.player.y, this);

            // 3. Player Collision & Smooth Knockback
            boss.update(this.player.x, this.player.y, this);
            if (this.player.collidesWith(boss)) {
                        const dx = this.player.centerX() - boss.centerX();
                        const dy = this.player.centerY() - boss.centerY();
                        const dist = Math.hypot(dx, dy) || 1;
                        
                        // Set an initial velocity instead of teleporting
                        // (15 is a good number because it will multiply across several frames)
                        const knockbackForce = 30; 
                        this.player.kbX = (dx / dist) * knockbackForce;
                        this.player.kbY = (dy / dist) * knockbackForce;
                        this.processDamage(boss.damage|| 20);
            }
        });
        // 3. Filter out dead objects
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.bosses = this.bosses.filter(b => !b.markedForDeletion);
    }

    processDamage(damage) {
        // Check if forcefield is active and can absorb the damage
        if (this.forcefield && this.forcefield.isStillActive()) {
            this.forcefield.takeDamage();
            // No i-frames when forcefield absorbs damage
            if (!this.forcefield.isStillActive()) {
                console.log("DEBUG: Forcefield broken!");
            }
            return; // Damage absorbed, no player HP loss
        }

        // Normal damage processing with invincibility frames
        const now = performance.now();
        if (now - this.lastDamageTime < this.invincibilityDuration) {
            console.log("DEBUG: Damage Ignored (Invincibility Frames)");
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

        this.forcefieldPickups.forEach(shield => {
            const dist = shield.getDistance(this.player);
            if (dist < 150) { // Magnet range
                const moveX = (this.player.centerX() - shield.centerX()) * 0.1;
                const moveY = (this.player.centerY() - shield.centerY()) * 0.1;
                shield.x += moveX;
                shield.y += moveY;
            }
            if (!shield.markedForDeletion && this.player.collidesWith(shield)) {
                shield.markedForDeletion = true;
                if (this.forcefield && this.forcefield.isStillActive()) {
                    // Stack: add 3 more hits and reset timer
                    this.forcefield.stackShield();
                    console.log(`DEBUG: Shield stacked! Hits: ${this.forcefield.hitsRemaining}`);
                } else {
                    // First pickup: create new shield
                    this.forcefield = new Forcefield(this.player);
                    console.log("DEBUG: Forcefield Collected!");
                }
            }
        });

        this.xpOrbs = this.xpOrbs.filter(o => !o.markedForDeletion);
        this.HeartPickups = this.HeartPickups.filter(o => !o.markedForDeletion);
        this.forcefieldPickups = this.forcefieldPickups.filter(o => !o.markedForDeletion);
    }

    // levelUp() {
    //     this.stats.level++;
    //     this.stats.xp = 0;
    //     this.stats.maxXp = Math.floor(this.stats.maxXp * 1.5);
    //     this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 20);
    //     this.stats.maxHp += 10;
    //     console.log("DEBUG: Level Up! Level " + this.stats.level);
    //     if (this.stats.level % 5 === 0) {
    //         this.stats.speed = Math.min(10, this.stats.speed + 1);
    //         console.log("DEBUG: Speed Increased! Speed: " + this.stats.speed);
    //     }
    //     if (this.stats.level % 3 === 0 ){
    //         this.stats.attackCooldown = Math.max(30, this.stats.attackCooldown - 20);
    //         console.log("DEBUG: Attack Speed Increased! Cooldown: " + this.stats.attackCooldown);
    //     }
    // }

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
            ...this.enemies, ...this.bosses, ...this.xpOrbs, ...this.HeartPickups, ...this.forcefieldPickups, ...this.projectiles];
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

        // Draw forcefield around player if active
        if (this.forcefield && this.forcefield.isStillActive()) {
            const screenX = this.player.x - this.camera.x;
            const screenY = this.player.y - this.camera.y;
            this.forcefield.draw(this.ctx, screenX, screenY, this.gameFrame);
        }

        this.drawUI(timestamp);
        this.drawDamageOverlay(timestamp);
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

        // Draw pause overlay
        if (this.manualPause) {
            this.drawPauseScreen();
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
        this.levelUpSystem.drawXPBar(this.ctx, 20, 80, 400, 40);
        
        const stamWidth = 500;
        const stamHeight = 50;
        const marginX = 40;
        const marginY = 40;
        const stamX = this.width - stamWidth - marginX;
        const stamY = this.height - stamHeight - marginY;

        this.drawStaminaBar(ctx, stamX, stamY, stamWidth, stamHeight, this.stats.stamina, this.stats.maxStamina);
        // Wave Info — use pauseStartTime as effective "now" while paused
        const effectiveTimestamp = this.manualPause ? this.pauseStartTime : timestamp;
        const waveElapsed = (effectiveTimestamp - this.waveStartTime) / 1000;
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
        // Pause hint (bottom-center)
        ctx.fillStyle = "rgba(25, 255, 25, 0.4)";
        ctx.font = "25px arcadeclassic, Arial";
        ctx.textAlign = "center";
        ctx.fillText("ESC  to  Pause", this.width / 2, 30);
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
        this.ctx.fillText('- Auto-attack: Projectiles fire periodically, all attacks are automatic', left, y); y += lineH;
        this.ctx.fillText('- Objective: Survive as long as possible', left, y); y += lineH;
        this.ctx.fillText('  Kill enemies to collect XP orbs to level up and get stronger.', left, y); y += lineH * 2;

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

        // 6. Show small wave reward text (HP + XP) if it was a non-upgrade wave
        if (this.waveRewardText && this.waveRewardTime) {
            const rewardAge = timestamp - this.waveRewardTime;
            if (rewardAge < 3000) {
                const fadeAlpha = rewardAge < 2000 ? 1 : 1 - (rewardAge - 2000) / 1000;
                this.ctx.globalAlpha = fadeAlpha;
                this.ctx.fillStyle = "#66ff66";
                this.ctx.font = "bold 28px arcadeclassic, Arial";
                this.ctx.fillText(this.waveRewardText, this.width / 2, this.height / 4 + 150);
                this.ctx.globalAlpha = 1;
            }
        }

        this.ctx.restore();
    }

    drawPauseScreen() {
        this.ctx.save();

        // Darken background
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // "PAUSED" text
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.shadowColor = "rgba(0, 200, 255, 0.6)";
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 80px arcadeclassic, Arial";
        this.ctx.fillText("PAUSED", this.width / 2, this.height / 2 - 30);

        // Subtitle
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#aaa";
        this.ctx.font = "28px arcadeclassic, Arial";
        this.ctx.fillText("Press  ESC  to  Resume", this.width / 2, this.height / 2 + 30);

        this.ctx.restore();
    }

    drawDamageOverlay(timestamp) {
        // We use performance.now() here to perfectly match how you set this.lastDamageTime
        const now = performance.now(); 
        const timeSinceHit = now - this.lastDamageTime;
        
        // Check if we are currently in the invincibility period
        if (timeSinceHit < this.invincibilityDuration) {
            this.ctx.save();
            
            // Calculate a pulsing opacity (rapid heartbeat flash)
            // The / 60 controls the speed of the flash, and * 0.6 is the maximum opacity.
            const alpha = Math.abs(Math.sin(now / 60)) * 0.6;
            
            // Create a radial gradient to fill the corners with red
            const gradient = this.ctx.createRadialGradient(
                this.width / 2, this.height / 2, this.height / 3,  // Inner circle (transparent)
                this.width / 2, this.height / 2, this.width / 1.5  // Outer edge (flashing red)
            );
            
            gradient.addColorStop(0, "rgba(255, 0, 0, 0)");
            gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);
            
            // Draw the gradient over the whole screen
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.restore();
        }
    }
    animate(timestamp) {
        // Handle first frame edge case
        if (!this.lastTime) {
            this.lastTime = timestamp;
            this.accumulator = 0;
        }

        const elapsed = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Fixed timestep: game logic runs at exactly 60 ticks/sec
        // regardless of monitor refresh rate or mouse activity
        const TICK_RATE = 1000 / 60; // ~16.67ms per tick
        this.accumulator += elapsed;

        // Cap accumulator to prevent spiral of death (e.g. after tab switch)
        if (this.accumulator > 200) this.accumulator = 200;

        while (this.accumulator >= TICK_RATE) {
            this.update(timestamp);
            this.accumulator -= TICK_RATE;
        }

        // Draw runs every frame for smooth rendering
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