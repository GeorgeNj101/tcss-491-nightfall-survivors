import ItemObject from "./ItemObject.js";
export default class LevelUp {
    constructor(player, game) {
        this.player = player;
        this.game = game; // Reference to the game instance
        
        // Initialize player level and XP
        this.player.level = 1;
        this.player.xp = 0;
        this.player.maxXP = 3;
        
        // Level up state
        this.isLevelingUp = false;
        this.waveLevelUp = false;
        this.pendingLevelUps = 0; // Track multiple level ups at once

        this.LevelUpFrame = Math.floor(game.lastTime/this.game.frameTime);
        
        // Upgrade options (will be populated in Step 3)
        this.availableUpgrades = [
            // Pistol weapon
            new ItemObject(
                1, this.loadImage("assets/pistol.png"), "weapon", "Pistol", "Slow but reliable sidearm. Click inventory to equip.",
                (game) => { }, // Auto-removal handles the splicing now!
                {
                    damage: 15, fireRate: 2, projectileSpeed: 480, range: 800, spread: 0,
                    projectileSprite: "assets/Shuriken.png", cols: 6, rows: 1, size:30, radius: 15,
                    currentLevel: 0, maxLevel: 1 
                }
            ),
            // Sprint
            new ItemObject(
                1, this.loadImage("assets/sprint.png"), "passive", "Sprint", "Increased maximum stamina.",
                (game) => {
                    game.stats.speed += 1;
                }
            ),
            // Xp Orb
            new ItemObject(
                1,
                this.loadImage("assets/Xp_Orb.png"),
                "consumable",
                "Sprint",
                "+10 Speed for 10 seconds",
                (game) => {
                    game.stats.maxStamina += 50; 
                    game.stats.stamina += 50; 
                    game.stats.staminaRegen += 0.2;
                },
                { currentLevel: 0, maxLevel: 3 }
            ),
            // HP Regen
            new ItemObject(
                4, this.loadImage("assets/Regen.png"), "passive", "Health Regen", "+1 Health Regeneration",
                (game) => { game.stats.hpRegen += 1/100; },
                { currentLevel: 0, maxLevel: 2 }
            ),
            // Max HP
            new ItemObject(
                4, this.loadImage("assets/Max Health.png"), "passive", "Max Hp", "+10 Maximum Health",
                (game) => {
                    game.stats.maxHp += 30;
                    game.stats.hp += 30;
                },
                { currentLevel: 0, maxLevel: 5 }
            ),
            // Fire Rate
            new ItemObject(
                4,
                this.loadImage("assets/Max Health.png"),
                "passive",
                "Max Hp",
                "+10 Maximum Health",
                (game) => {
                    game.stats.maxHp += 10;
                    game.stats.hp += 10;
                }
            ),
            // Damage Up
            new ItemObject(
                1, this.loadImage("assets/damageincrease.png"), "passive", "Damage Up", "Increases damage multiplier.",
                (game) => {
                    game.stats.damageMultiplier *= 1.25;
                    console.log("Damage multiplier is now: " + game.stats.damageMultiplier);
                },
                { currentLevel: 0, maxLevel: 5} 
            )
        ];

        this.selectedUpgrades = []; // Player's inventory
        this.currentChoices = [];

        this.selectedUpgrades = []; // Player's inventory
        this.currentChoices = [];    // Upgrades offered this level up

        // Card layout constants
        this.cardWidth = 200;
        this.cardHeight = 270;
        this.cardSpacing = 30;
        this.cardY = 300; // top of cards
        this.hoveredIndex = -1; // which card is hovered
    }
    
    /**
     * Calculate XP needed for next level (exponential growth)
     * Formula: 10 * (1.5 ^ (level - 1))
     * Level 1→2: 10 XP
     * Level 2→3: 15 XP
     * Level 3→4: 22 XP
     * Level 4→5: 33 XP
     * Level 5→6: 50 XP
     */
    getXPForNextLevel(level) {
        return Math.floor(3 + Math.pow(2, level - 1));
    }
    
    /**
     * Add XP to the player and check for level up
     * @param {number} amount - Amount of XP to add
     */
    addXP(amount) {
        this.player.xp += amount;
        this.checkLevelUp();
    }
    
    /**
     * Check if player has enough XP to level up
     * Handles multiple level ups at once (if player gains a lot of XP)
     */
    checkLevelUp() {
        while (this.player.xp >= this.player.maxXP) {
            // Level up!
            this.player.level++;
            this.player.xp = this.player.xp - this.player.maxXP; // Carry over excess XP
            this.player.maxXP = this.getXPForNextLevel(this.player.level);
            
            this.pendingLevelUps++;
            
            console.log(`Level Up! Now level ${this.player.level}. Next level needs ${this.player.maxXP} XP.`);
        }
        
        // If we have pending level ups, trigger the level up menu
        if (this.pendingLevelUps > 0 && !this.isLevelingUp && !this.game.isWaveTransitioning) {
            this.triggerLevelUpMenu();
        }
    }
    
    /**
     * Generate random upgrade choices from the pool
     */
    generateChoices() {
        // Shuffle and pick up to 3 (or all if fewer than 3)
        const pool = [...this.availableUpgrades];
        const count = Math.min(3, pool.length);
        const choices = [];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            choices.push(pool.splice(idx, 1)[0]);
        }
        return choices;
    }

    /**
     * Trigger the level up menu
     */
    triggerLevelUpMenu() {
        this.isLevelingUp = true;
        this.currentChoices = this.generateChoices();
        this.hoveredIndex = -1;

        // Pause the game and track pause start time
        if (this.game) {
            this.game.gamePaused = true;
            this.game.pauseStartTime = performance.now();
        }

        console.log("Level up menu triggered! Choose an upgrade or press SPACE to skip.");
    }
     triggerWaveLevelUpMenu() {
        this.waveLevelUp = true;
        this.currentChoices = this.generateChoices();
        this.hoveredIndex = -1;

        // Pause the game and track pause start time
        if (this.game) {
            this.game.gamePaused = true;
            this.game.pauseStartTime = performance.now();
        }

        console.log("wave power up menu triggered! Choose an upgrade or press SPACE to skip.");
    }
    
    /**
     * Select an upgrade (Step 5)
     * @param {object} upgrade - The upgrade object to apply
     */
    selectUpgrade(upgrade) {
        this.selectedUpgrades.push(upgrade);
        
        // Apply upgrade effect
        this.applyUpgrade(upgrade);

        if (this.waveLevelUp) {
            // If it was a wave-completion powerup, close it immediately
            this.closeLevelUpMenu();
        } else {

            this.pendingLevelUps--;
            
            if (this.pendingLevelUps <= 0) {
                this.closeLevelUpMenu();
            } else {
                // Generate NEW choices for the next pending level up!
                this.currentChoices = this.generateChoices();
                //this.hoveredIndex = -1;
            }
        }
    }
    
    /**
     * Apply the upgrade effect to the player
     * @param {object} upgrade - The upgrade to apply
     */
    applyUpgrade(upgrade) {
        // Run the upgrade's effect (stat changes, etc.)
        // if (typeof upgrade.effect === 'function') {
        //     upgrade.effect(this.game);
        // }

        // Add to inventory (weapons persist, consumables also show)
            // if(upgrade.type === "weapon" || upgrade.type === "consumable") {
            //     this.game.inventory.addItem(upgrade);
            // }
        

        // If it's a weapon and we don't have a current weapon, equip it
        // if (upgrade.type === "weapon" && !this.game.currentWeapon) {
        //     this.game.currentWeapon = upgrade;
        // }

        console.log(`Applied upgrade: ${upgrade.name} (${upgrade.type})`);
    }

    /**
     * Helper to properly load an image
     */
    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }
    
    /**
     * Close the level up menu and resume game
     */
    closeLevelUpMenu() {
        this.isLevelingUp = false;
        this.waveLevelUp = false;
        this.pendingLevelUps = 0;
        this.LevelUpFrame = 0


        if (this.game) {
            const pauseDuration = performance.now() - this.game.pauseStartTime;
            this.game.totalPauseTime += pauseDuration;
            this.game.waveStartTime += pauseDuration;
            //if (!this.game.isWaveTransitioning) {
                this.game.gamePaused = false;
            //}
        }

        console.log("Level up menu closed. Game resumed.");
    }
    
    /**
     * Draw the XP bar on the screen
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Bar width
     * @param {number} height - Bar height
     */
    drawXPBar(ctx, x, y, width, height) {
        const percent = Math.max(0, this.player.xp) / Math.max(1, this.player.maxXP);
        
        ctx.save();
        
        // 1. Background (Dark translucent glass)
        ctx.fillStyle = "rgba(10, 10, 20, 0.7)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.fill();

        ctx.shadowBlur = 0; 
        ctx.shadowOffsetY = 0;

        // 2. Gradient Fill (Neon Purple to Deep Blue)
        if (percent > 0) {
            const gradient = ctx.createLinearGradient(x, y, x + width, y);
            gradient.addColorStop(0, "#8E2DE2"); // Vibrant Purple
            gradient.addColorStop(1, "#4A00E0"); // Deep Blue

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, width * percent, height, 8);
            ctx.fill();
        }

        // 3. Outer Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.stroke();

        // 4. Centered Text Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Text shadow for readability
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(`LVL ${this.player.level} - XP: ${Math.floor(this.player.xp)} / ${this.player.maxXP}`, x + width / 2, y + height / 2 + 1);

        ctx.restore();
    }
    
    /**
     * Draw the level up menu overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    /**
     * Get the bounding rect for a card at a given index
     */
    getCardRect(index, canvasWidth) {
        const totalCards = this.currentChoices.length;
        const totalWidth = totalCards * this.cardWidth + (totalCards - 1) * this.cardSpacing;
        const startX = (canvasWidth - totalWidth) / 2;
        const x = startX + index * (this.cardWidth + this.cardSpacing);
        return { x, y: this.cardY, w: this.cardWidth, h: this.cardHeight };
    }

    /**
     * Handle mouse click on upgrade cards
     */
    handleClick(mx, my, isOn) {
        if (!isOn) return;
        const canvasWidth = this.game.canvas.width;
        for (let i = 0; i < this.currentChoices.length; i++) {
            const r = this.getCardRect(i, canvasWidth);
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                this.selectUpgrade(this.currentChoices[i]);
                return;
            }
        }
    }

    drawLevelUpMenu(ctx, canvasWidth, canvasHeight) {
        // Update hover state from mouse position
        this.hoveredIndex = -1;
        if (this.game.mouse) {
            const mx = this.game.mouse.x;
            const my = this.game.mouse.y;
            for (let i = 0; i < this.currentChoices.length; i++) {
                const r = this.getCardRect(i, canvasWidth);
                if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                    this.hoveredIndex = i;
                    break;
                }
            }
        }

        // Darker semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Title with glow effect
        ctx.shadowColor = "gold";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "gold";
        ctx.font = "bold 72px Arial";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL UP!", canvasWidth / 2, 150);
        ctx.shadowBlur = 0;

        // Level info
        ctx.fillStyle = "white";
        ctx.font = "36px Arial";
        ctx.fillText(`Level ${this.player.level}`, canvasWidth / 2, 230);

        // Pending level ups indicator
        if (this.pendingLevelUps > 1) {
            ctx.font = "24px Arial";
            ctx.fillStyle = "yellow";
            ctx.fillText(`(${this.pendingLevelUps} level ups pending)`, canvasWidth / 2, 270);
        }

        // Draw upgrade cards
        for (let i = 0; i < this.currentChoices.length; i++) {
            this.drawCard(ctx, i, canvasWidth);
        }

        // Instructions
        ctx.fillStyle = "#aaa";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Click a card to choose  |  SPACE to skip", canvasWidth / 2, canvasHeight - 60);
    }
    drawWaveLevelUpMenu(ctx, canvasWidth, canvasHeight) {
        // Update hover state from mouse position
        this.hoveredIndex = -1;
        if (this.game.mouse) {
            const mx = this.game.mouse.x;
            const my = this.game.mouse.y;
            for (let i = 0; i < this.currentChoices.length; i++) {
                const r = this.getCardRect(i, canvasWidth);
                if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                    this.hoveredIndex = i;
                    break;
                }
            }
        }

        // Darker semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Title with glow effect
        ctx.shadowColor = "gold";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "gold";
        ctx.font = "bold 72px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Wave Power Up!", canvasWidth / 2, 150);
        ctx.shadowBlur = 0;

        // Level info
        ctx.fillStyle = "white";
        ctx.font = "36px Arial";
        ctx.fillText(`Wave ${this.game.getWave()} completed`, canvasWidth / 2, 230);

        // Pending level ups indicator
        if (this.pendingLevelUps > 1) {
            ctx.font = "24px Arial";
            ctx.fillStyle = "yellow";
            ctx.fillText(`(${this.pendingLevelUps} level ups pending)`, canvasWidth / 2, 270);
        }

        // Draw upgrade cards
        for (let i = 0; i < this.currentChoices.length; i++) {
            this.drawCard(ctx, i, canvasWidth);
        }

        // Instructions
        ctx.fillStyle = "#aaa";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Click a card to choose  |  SPACE to skip", canvasWidth / 2, canvasHeight - 60);
    }

    /**
     * Draw a single upgrade card
     */
    drawCard(ctx, index, canvasWidth) {
        const upgrade = this.currentChoices[index];
        const r = this.getCardRect(index, canvasWidth);
        const hovered = index === this.hoveredIndex;

        ctx.fillStyle = hovered ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.08)";
        ctx.fillRect(r.x, r.y, r.w, r.h);

        const borderColor = upgrade.type === "weapon" ? "rgba(255, 100, 100, 0.9)"
                          : upgrade.type === "consumable" ? "rgba(100, 255, 100, 0.9)"
                          : "rgba(100, 200, 255, 0.9)"
        ctx.strokeStyle = hovered ? "white" : borderColor;
        ctx.lineWidth = hovered ? 3 : 2;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        const iconSize = 64;
        const iconX = r.x + (r.w - iconSize) / 2;
        const iconY = r.y + 25;
        if (upgrade.image && upgrade.image.complete) {
            let cardX = upgrade.frameWidth
            let cardFrame = this.LevelUpFrame%upgrade.frame
            ctx.drawImage(upgrade.image, cardX * cardFrame, 0, cardX, upgrade.image.height, iconX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = "#555";
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
        }

        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(upgrade.name, r.x + r.w / 2, iconY + iconSize + 30);

        ctx.font = "14px Arial";
        ctx.fillStyle = borderColor;
        ctx.fillText(`[${upgrade.type.toUpperCase()}]`, r.x + r.w / 2, iconY + iconSize + 50);

        // --- NEW: Draw Level Progression Text ---
        if (upgrade.stats && upgrade.stats.maxLevel) {
            // Display what level they are ABOUT to get if they click this card
            const nextLevel = (upgrade.stats.currentLevel || 0) + 1;
            const max = upgrade.stats.maxLevel;
            
            ctx.font = "bold 14px Arial";
            if (nextLevel === max) {
                ctx.fillStyle = "gold";
                ctx.fillText(`Level ${nextLevel} (MAX)`, r.x + r.w / 2, iconY + iconSize + 70);
            } else {
                ctx.fillStyle = "#00f2fe"; // Cyan
                ctx.fillText(`Level ${nextLevel} / ${max}`, r.x + r.w / 2, iconY + iconSize + 70);
            }
        }

        // Shift description down so it doesn't overlap the new level text
        const descY = (upgrade.stats && upgrade.stats.maxLevel) ? iconY + iconSize + 95 : iconY + iconSize + 75;
        
        ctx.fillStyle = "#ccc";
        ctx.font = "14px Arial";
        this.drawWrappedText(ctx, upgrade.description, r.x + r.w / 2, descY, r.w - 20, 18);
        this.LevelUpFrame=Math.floor(this.game.lastTime/this.game.frameTime);
    }
    /**
     * Simple word-wrap text drawing
     */
    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let curY = y;
        for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            if (ctx.measureText(testLine).width > maxWidth && line) {
                ctx.fillText(line, x, curY);
                line = word;
                curY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line) ctx.fillText(line, x, curY);
    }

    getMaxXp() {
        return this.player.maxXp;
    }
}

