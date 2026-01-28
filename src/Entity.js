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
            this.X = x + offset * 2;
        }else{
            this.X = x;
        }

        let rangeY = scaleY - (2 * offset);
        let y = Math.random() * rangeY;
        if (y > (rangeY / 2)) {
            this.Y = y + offset * 2;
        }else{
            this.Y = y;
        }
    }

    draw(ctx, gameFrame) {
        super.draw(ctx, gameFrame, this.X, this.Y);
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