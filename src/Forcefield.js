export default class Forcefield {
    constructor(player) {
        this.player = player;
        this.hitsRemaining = 3;
        this.image = new Image();
        this.image.src = "assets/forcefield.png";
        this.isActive = true;
        this.createdAt = performance.now();
        this.scale = 1; // For animation/visual effect
    }

    /**
     * Take damage to the forcefield
     * Returns true if forcefield absorbed the hit, false if depleted
     */
    takeDamage() {
        if (this.hitsRemaining > 0) {
            this.hitsRemaining--;
            // Optional: add visual feedback (flash effect)
            this.scale = 1.2;
            return true; // Forcefield absorbed the hit
        }
        this.isActive = false;
        return false; // Forcefield is depleted
    }

    /**
     * Check if forcefield is still active
     */
    isStillActive() {
        return this.isActive && this.hitsRemaining > 0;
    }

    /**
     * Draw the forcefield around the player
     */
    draw(ctx, screenX, screenY, gameFrame) {
        if (!this.isStillActive()) return;

        // Animate the scale back to normal
        this.scale = Math.max(1, this.scale - 0.1);

        ctx.save();
        
        // Position forcefield at player center
        const centerX = screenX + this.player.frameWidth / 2;
        const centerY = screenY + this.player.frameHeight / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.image.width / 2, -this.image.height / 2);

        ctx.drawImage(this.image, 0, 0);

        ctx.restore();

        // Draw hit counter (optional visual feedback)
        ctx.save();
        ctx.fillStyle = "cyan";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Shield: ${this.hitsRemaining}`, centerX, screenY - 30);
        ctx.restore();
    }

    /**
     * Get remaining hits
     */
    getHitsRemaining() {
        return this.hitsRemaining;
    }
}
