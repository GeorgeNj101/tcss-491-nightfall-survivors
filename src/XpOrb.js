class XpOrb {
    constructor(x, y) {
        this.X = x - 8;
        this.Y = y - 8;

        // this.X += 128 * (Math.random() - 0.5);
        // this.Y += 128 * (Math.random() - 0.5);

        this.image = new Image();
        this.loaded = false;

        this.cols = 7;
        this.rows = 1;

        this.image.onload = () => {
            this.loaded = true;
            this.frameWidth = this.image.width / this.cols;
            this.frameHeight = this.image.height / this.rows;
        };

        this.image.src = "assets/Xp_Orb.png"; // FIXED PATH
    }

    moveInDirection(speed, direction) {
        switch (direction) {
            case 0: this.Y += speed; break; // forward
            case 1: this.X += speed; break; // right
            case 2: this.X -= speed; break; // left
            case 3: this.Y -= speed; break; // backward
        }
    }

    CenterX(){
        return this.X + (this.frameWidth/2)
    }
    CenterY(){
        return this.Y + (this.frameHeight/2)
    }

    draw(ctx, gameFrame) {
        if (!this.loaded) return;

        const col = gameFrame % this.cols;
        const sx = col * this.frameWidth;
        const sy = 0;

        ctx.drawImage(
            this.image,
            sx, sy,
            this.frameWidth, this.frameHeight,
            this.X, this.Y,
            this.frameWidth, this.frameHeight
        );
    }
}