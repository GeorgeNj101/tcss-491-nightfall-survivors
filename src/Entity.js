const OffsetScale = 2;
class Entity extends Sprite {
    X;
    Y;
    constructor(pngPath) {
        super(pngPath);
        this.spawn();
    }
    spawn(){
        let offset = 128 * OffsetScale;

        let rangeX = scaleX - (2 * offset);
        let x = Math.random() * rangeX;
        if (x > (rangeX / 2)) {
            this.X = x + offset * -(this.frameWidth/2)
        }else{
            this.X = x-(this.frameWidth/2)
        }

        let rangeY = scaleY - (2 * offset);
        let y = Math.random() * rangeY;
        if (y > (rangeY / 2)) {
            this.Y = y + offset * 2 -(this.frameHeight/2)
        }else{
            this.Y = y-(this.frameHeight/2)
        }
    }

    draw(ctx, gameFrame) {
        super.draw(ctx, gameFrame, this.X, this.Y);
    }

    CenterX(){
        return this.X+(this.frameWidth/2)
    }
    CenterY(){
        return this.Y+(this.frameHeight/2)
    }

    move(speed) {
        this.moveInDirection(speed, this.direction);
    }

    moveInDirection(speed, theDirection) {
        switch (theDirection) {
            case 0: this.Y += speed; break; // forward
            case 1: this.X += speed; break; // right
            case 2: this.X -= speed; break; // left
            case 3: this.Y -= speed; break; // backward
        }
    }

    compare(other) {
        if (this.Y < other.Y) return -1;
        if (this.Y > other.Y) return 1;
        if (this.X < other.X) return -1;
        if (this.X > other.X) return 1;
        return 0;
    }
}