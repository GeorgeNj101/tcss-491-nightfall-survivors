export default class Projectile {
    constructor(x, y, dx, dy, range, speed, rate, damage, image) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.speed = speed; // Projectile speed
        this.range = range; // Max distance before deletion
        this.rate = rate; // Fire rate
        this.damage = damage; // Damage amount
        this.image = image; // Image to draw
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
}