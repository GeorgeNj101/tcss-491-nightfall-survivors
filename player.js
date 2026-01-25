class Player {
    constructor(game) {
        this.game = game;
        this.x = 200; 
        this.y = 200;

        // Movement state
        this.direction = "down"; // default
        this.speed = 150;

        // Animations
        this.animations = {
            up: new Animator(ASSET_MANAGER.getAsset("./player_up.png"),
                0, 0, 45, 110, 3, 0.15),

            down: new Animator(ASSET_MANAGER.getAsset("./player_down.png"),
                0, 0, 45, 110, 3, 0.15),

            left: new Animator(ASSET_MANAGER.getAsset("./player_left.png"),
                0, 0, 45, 110, 3, 0.15),

            right: new Animator(ASSET_MANAGER.getAsset("./player_right.png"),
                0, 0, 45, 110, 3, 0.15)
        };
    }
    update() {
    let moving = false;

    if (this.game.keys["w"]) {
        this.y -= this.speed * this.game.clockTick;
        this.direction = "up";
        moving = true;
    }
    if (this.game.keys["s"]) {
        this.y += this.speed * this.game.clockTick;
        this.direction = "down";
        moving = true;
    }
    if (this.game.keys["a"]) {
        this.x -= this.speed * this.game.clockTick;
        this.direction = "left";
        moving = true;
    }
    if (this.game.keys["d"]) {
        this.x += this.speed * this.game.clockTick;
        this.direction = "right";
        moving = true;
    }

    // If not moving, reset animation to first frame
    if (!moving) {
        this.animations[this.direction].elapsedTime = 0;
    }
}
draw(ctx) {
    const anim = this.animations[this.direction];
    anim.drawFrame(this.game.clockTick, ctx, this.x, this.y);
}


}