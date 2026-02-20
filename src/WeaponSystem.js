export default class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.lastShotTime = 0;
    }

    tryShoot(currentTime, originX, originY, directionX, directionY) {
        const weapon = this.game.currentWeapon;
        if (!weapon || weapon.type !== "weapon") return;

        const stats = weapon.stats || {};
        const fireRate = stats.fireRate || 2; // shots per second
        const cooldown = 1000 / fireRate;     // ms between shots

        if (currentTime - this.lastShotTime < cooldown) return;

        this.lastShotTime = currentTime;

        const speed = stats.projectileSpeed || 500;
        const damage = stats.damage || 5;
        const range = stats.range || 400;
        const sprite = stats.projectileSprite || "assets/Shuriken.png";

        // Normalize direction
        const len = Math.hypot(directionX, directionY) || 1;
        const dx = (directionX / len) * speed;
        const dy = (directionY / len) * speed;

        this.game.spawnProjectile({
            x: originX,
            y: originY,
            vx: dx,
            vy: dy,
            damage,
            range,
            sprite
        });
    }
}
