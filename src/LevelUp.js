class LevelUp {
    constructor(player) {
        this.player = player;
        
        // Initialize player level and XP
        this.player.level = 1;
        this.player.xp = 0;
        this.player.maxXP = 10;
        
        // Level up state
        this.isLevelingUp = false;
        this.pendingLevelUps = 0; // Track multiple level ups at once
        
        // Upgrade options (will be populated in Step 3)
        this.availableUpgrades = [];
        this.selectedUpgrades = []; // Player's inventory
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
     * Trigger the level up menu (Step 2)
     */
    triggerLevelUpMenu() {
        this.isLevelingUp = true;

        // Pause the game (will be set in game.js)
        if (typeof gamePaused !== 'undefined') {
            gamePaused = true;
        }

        console.log("Level up menu triggered! Press SPACE to skip upgrade.");
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
        // TODO: Implement upgrade effects (Step 5)
        console.log(`Applied upgrade: ${upgrade.name}`);
    }
    
    /**
     * Close the level up menu and resume game
     */
    closeLevelUpMenu() {
        this.isLevelingUp = false;
        this.pendingLevelUps = 0; // Clear all pending level ups

        // Resume the game (will be set in game.js)
        if (typeof gamePaused !== 'undefined') {
            gamePaused = false;
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
    drawLevelUpMenu(ctx, canvasWidth, canvasHeight) {
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

        // Reset shadow
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

        // Placeholder for upgrade options (Step 3)
        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.fillText("Choose an upgrade:", canvasWidth / 2, 350);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#aaa";
        ctx.fillText("(Upgrade options coming in Step 3)", canvasWidth / 2, 390);

        // Instructions
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText("Press SPACE to skip and continue", canvasWidth / 2, canvasHeight - 80);
    }

    /**
     * Draw the inventory at bottom left (Step 6)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawInventory(ctx) {
        // TODO: Implement inventory display (Step 6)
    }
}

