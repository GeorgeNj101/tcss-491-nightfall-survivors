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
        this.pendingLevelUps = 0; // Track multiple level ups at once
        
        // Upgrade options (will be populated in Step 3)
        this.availableUpgrades = [
            // Pistol weapon
            new ItemObject(
                this.loadImage("assets/pistol.png"),
                "weapon",
                "Pistol",
                "Basic pistol. Medium damage, medium fire rate.",
                (game) => {
                    // When acquired, set as current weapon and add to inventory
                    const pistolItem = game.inventory.inventory.find(i => i.name === "Pistol");
                    if (pistolItem) {
                        game.currentWeapon = pistolItem;
                    }
                },
                {
                    damage: 10,
                    fireRate: 3,          // shots per second
                    projectileSpeed: 600, // px/sec
                    range: 500,           // px
                    spread: 0,            // degrees
                    projectileSprite: "assets/Fireball.png" // or a bullet sprite
                }
            ),
            // Xp Orb
            new ItemObject(
                this.loadImage("assets/Xp_Orb.png"),
                "passive",
                "Sprint",
                "+1 Speed",
                (game) => {
                    game.stats.speed += 1;
                }
            ),

        ];
        

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
        return Math.floor(10 * Math.pow(1.5, level - 1));
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
        if (this.pendingLevelUps > 0 && !this.isLevelingUp) {
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
    
    /**
     * Select an upgrade (Step 5)
     * @param {object} upgrade - The upgrade object to apply
     */
    selectUpgrade(upgrade) {
        this.selectedUpgrades.push(upgrade);
        this.pendingLevelUps--;
        
        // Apply upgrade effect
        this.applyUpgrade(upgrade);
        
        // If no more pending level ups, close menu
        if (this.pendingLevelUps <= 0) {
            this.closeLevelUpMenu();
        }
    }
    
    /**
     * Apply the upgrade effect to the player
     * @param {object} upgrade - The upgrade to apply
     */
    applyUpgrade(upgrade) {
        // Run the upgrade's effect (stat changes, etc.)
        if (typeof upgrade.effect === 'function') {
            upgrade.effect(this.game);
        }

        // Add to inventory (weapons persist, consumables also show)
        this.game.inventory.addItem(upgrade);

        // If it's a weapon and we don't have a current weapon, equip it
        if (upgrade.type === "weapon" && !this.game.currentWeapon) {
            this.game.currentWeapon = upgrade;
        }

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
        this.pendingLevelUps = 0;

        if (this.game) {
            const pauseDuration = performance.now() - this.game.pauseStartTime;
            this.game.totalPauseTime += pauseDuration;
            this.game.waveStartTime += pauseDuration;
            this.game.gamePaused = false;
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
        // Background
        ctx.fillStyle = "#000055";
        ctx.fillRect(x, y, width, height);
        
        // XP progress
        const xpPercent = this.player.xp / this.player.maxXP;
        ctx.fillStyle = "blue";
        ctx.fillRect(x, y, width * xpPercent, height);
        
        // Border
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Text
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `Level ${this.player.level} - XP: ${Math.floor(this.player.xp)} / ${this.player.maxXP}`,
            x + width / 2,
            y + height - 4
        );
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
    handleClick(mx, my) {
        if (!this.isLevelingUp) return;
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

    /**
     * Draw a single upgrade card
     */
    drawCard(ctx, index, canvasWidth) {
        const upgrade = this.currentChoices[index];
        const r = this.getCardRect(index, canvasWidth);
        const hovered = index === this.hoveredIndex;

        // Card background
        ctx.fillStyle = hovered ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.08)";
        ctx.fillRect(r.x, r.y, r.w, r.h);

        // Card border (color by type)
        const borderColor = upgrade.type === "weapon" ? "rgba(255, 100, 100, 0.9)"
                          : upgrade.type === "passive" ? "rgba(100, 200, 255, 0.9)"
                          : "rgba(100, 255, 100, 0.9)";
        ctx.strokeStyle = hovered ? "white" : borderColor;
        ctx.lineWidth = hovered ? 3 : 2;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        // Icon (centered, 64x64)
        const iconSize = 64;
        const iconX = r.x + (r.w - iconSize) / 2;
        const iconY = r.y + 25;
        if (upgrade.image && upgrade.image.complete) {
            ctx.drawImage(upgrade.image, iconX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = "#555";
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
        }

        // Name
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(upgrade.name, r.x + r.w / 2, iconY + iconSize + 30);

        // Type tag
        ctx.font = "14px Arial";
        ctx.fillStyle = borderColor;
        ctx.fillText(`[${upgrade.type.toUpperCase()}]`, r.x + r.w / 2, iconY + iconSize + 50);

        // Description (word-wrap in card)
        ctx.fillStyle = "#ccc";
        ctx.font = "14px Arial";
        this.drawWrappedText(ctx, upgrade.description, r.x + r.w / 2, iconY + iconSize + 72, r.w - 20, 18);
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
}

