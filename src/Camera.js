export default class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
    }

    update(target) {
        // Center the camera on the target (the player)
        // target.x is top-left, so add half width/height to get center
        const targetCenterX = target.x + (target.frameWidth / 2);
        const targetCenterY = target.y + (target.frameHeight / 2);

        this.x = targetCenterX - this.width / 2;
        this.y = targetCenterY - this.height / 2;
        

    }
}