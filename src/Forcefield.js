export default class Forcefield {
    constructor(player) {
        this.player = player;
        this.hitsRemaining = 3;
        this.image = new Image();
        this.image.src = "assets/forcefield.png";
        this.isActive = true;
        this.createdAt = performance.now();
        this.duration = 15000; // 15 seconds
        this.scale = 1; // For animation/visual effect
    }

    /**
     * Take damage to the forcefield
     * Returns true if forcefield absorbed the hit, false if depleted
     */
    takeDamage() {
        if (this.hitsRemaining > 0) {
            this.hitsRemaining--;
            this.scale = 1.2;
            return true;
        }
        this.isActive = false;
        return false;
    }

    /**
     * Check if forcefield is still active (hits remaining AND not expired)
     */
    isStillActive() {
        if (!this.isActive || this.hitsRemaining <= 0) return false;
        if (performance.now() - this.createdAt >= this.duration) {
            this.isActive = false;
            return false;
        }
        return true;
    }

    /** Remaining seconds on the timer */
    getRemainingTime() {
        const remaining = this.duration - (performance.now() - this.createdAt);
        return Math.max(0, remaining / 1000);
    }

    /**
     * Draw the forcefield around the player
     */
    draw(ctx, screenX, screenY, gameFrame) {
        if (!this.isStillActive()) return;

        const remaining = this.getRemainingTime();

        // Animate the scale back to normal
        this.scale = Math.max(1, this.scale - 0.1);

        // Flicker when about to expire (last 3 seconds)
        if (remaining <= 3) {
            const flicker = Math.sin(performance.now() / 80);
            if (flicker < 0) return; // skip drawing every other pulse
        }

        ctx.save();

        // Position forcefield at player center
        const centerX = screenX + this.player.frameWidth / 2;
        const centerY = screenY + this.player.frameHeight / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.image.width / 2, -this.image.height / 2);

        ctx.drawImage(this.image, 0, 0);

        ctx.restore();

        // Draw hit counter + timer
        ctx.save();
        ctx.fillStyle = remaining <= 3 ? "#ff4444" : "cyan";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Shield: ${this.hitsRemaining}  (${remaining.toFixed(1)}s)`, centerX, screenY - 30);
        ctx.restore();
    }

    /** Add 3 more hits and extend the timer by 15s + remaining time */
    stackShield() {
        this.hitsRemaining += 3;
        const remainingMs = Math.max(0, this.duration - (performance.now() - this.createdAt));
        this.createdAt = performance.now();
        this.duration = 15000 + remainingMs; // 15s + whatever was left
        this.isActive = true;
        this.scale = 1.3; // visual pop feedback
    }

    getHitsRemaining() {
        return this.hitsRemaining;
    }
}
