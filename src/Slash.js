import Sprite from "./Sprite.js";

export default class Slash extends Sprite {

    constructor(player) {
        super("assets/Slash.png", {
            x: player.centerX(),
            y: player.centerY(),
            cols: 4,
            rows: 1,
            sheetWidth: 204,
            sheetHeight: 128,
            radius: player.radius * 2
        });
        super.frameWidth = 51;
        super.frameHeigtht = 128;
        this.direction = 3/2*Math.PI;
        this.player = player;
        // this.updateDirection();
        this.lastDrawTime = Date.now().valueOf();
        this.x-=this.frameWidth/2;
        this.y-=this.frameHeight/2;
        this.isRotated = true;
    }

    updateDirection() {
        // if (this.player.direction === 3){this.direction = 1 }
        // if (this.player.direction === 0){this.direction = 3 }
        // if (this.player.direction === 2){this.direction = 0 }
        // if (this.player.direction === 1){this.direction = 2 }
        // this.x = this.player.centerX() - this.frameWidth/2
        // this.y = this.player.centerY() - this.frameHeight/2

        // 1. Calculate Center Points
        if (this.x !== this.player.centerX() - this.frameWidth/2 || this.y !== this.player.centerY() - this.frameHeight/2) {

            const myCx = this.centerX()
            const myCy = this.centerY()
            const plCx = this.player.centerX()
            const plCy = this.player.centerY()

            const dx = myCx - plCx;
            const dy = myCy - plCy;
            this.direction = Math.atan2(dy, dx);
        }

        this.x = this.player.centerX() - this.frameWidth/2
        this.y = this.player.centerY() - this.frameHeight/2
    }


    draw(ctx, gameFrame, screenX, screenY) {

        this.updateDirection()

        this.radius = this.player.radius * 2

        if (this.showHitbox) {
            ctx.beginPath();
            ctx.strokeStyle = "orange";
            ctx.arc(screenX + this.frameWidth/2,
                screenY + this.frameHeight/2,
                this.radius,
                0,
                Math.PI * 2);
            ctx.stroke();
        }

        // if(this.lastDrawTime  < Date.now().valueOf())
        {
            ctx.save()
            ctx.translate(screenX + this.frameWidth/2,screenY+this.frameHeight/2)
            this.lastDrawTime = Date.now().valueOf();
            ctx.rotate(this.direction);
            ctx.translate(-(screenX + this.frameWidth/2),-(screenY+this.frameHeight/2))

            ctx.drawImage(
                this.image,
                (gameFrame % this.cols)* this.frameWidth, 0, // Source X, Y
                this.frameWidth, this.frameHeight,             // Source W, H
                screenX - this.player.frameWidth/2, screenY,                              // Dest X, Y
                this.frameWidth, this.frameHeight              // Dest W, H
            );

            let CenterScreenX = screenX + this.frameWidth/2
            let CenterScreenY = screenY + this.frameHeight/2

            const Angle = 90/360*2*Math.PI;
            const SubAngle = Angle/3
            let hitLocation

            //frame is Up, middle, down, middle
            if((gameFrame % this.cols) === 0){
                hitLocation = 0
            }else if((gameFrame % this.cols)=== 2){
                hitLocation = 2
            }else {
                hitLocation = 1
            }


            // --- DRAW HITBOX LINES HERE (While origin is at centerX/Y) ---
            if (this.showHitbox) {
                ctx.beginPath();
                ctx.strokeStyle = "red";

                // Line 1
                ctx.moveTo(CenterScreenX -(this.radius * Math.cos(-Angle/2))/2,
                    CenterScreenY -(this.radius*Math.sin(-Angle/2))/2);
                ctx.lineTo(CenterScreenX-this.radius * Math.cos(-Angle/2), CenterScreenY-this.radius * Math.sin(-Angle/2));

                // Line 2
                ctx.moveTo(CenterScreenX-(this.radius*Math.cos(Angle/2))/2,
                    CenterScreenY -(this.radius*Math.sin(Angle/2))/2)
                ctx.lineTo(CenterScreenX- this.radius * Math.cos(Angle/2), CenterScreenY -this.radius * Math.sin(Angle/2));

                ctx.stroke();
            }

            // --- DRAW HITBOX  SUB LINES HERE (While origin is at centerX/Y) ---
            if (this.showHitbox) {
                ctx.beginPath();
                ctx.strokeStyle = "green";



                // Line 1
                ctx.moveTo(CenterScreenX - (this.radius * Math.cos(-Angle/2 + SubAngle*(2-hitLocation)))/2
                    , CenterScreenY - (this.radius * Math.sin(-Angle/2 + SubAngle*(2-hitLocation)))/2);
                ctx.lineTo(CenterScreenX-this.radius * Math.cos(-Angle/2 + SubAngle*(2-hitLocation)),
                    CenterScreenY-this.radius * Math.sin(-Angle/2 + SubAngle*(2-hitLocation)));
                ctx.stroke()
                ctx.beginPath()

                ctx.strokeStyle = "blue";

                // Line 2
                ctx.moveTo(CenterScreenX -(this.radius * Math.cos(Angle/2 -SubAngle*(hitLocation)))/2,
                    CenterScreenY-(this.radius * Math.sin(Angle/2-SubAngle*(hitLocation)))/2);
                ctx.lineTo(CenterScreenX- this.radius * Math.cos(Angle/2 -SubAngle*(hitLocation),),
                    CenterScreenY -this.radius * Math.sin(Angle/2-SubAngle*(hitLocation)));

                ctx.stroke();
            }

            ctx.restore()
        }
    }
}