import Sprite from "./Sprite.js";

export default class XpOrb extends Sprite {
    constructor(x, y) {
        // We use the Sprite constructor to load the sheet
        super("assets/Xp_Orb.png", { 
            x: x, 
            y: y, 
            cols: 7, 
            rows: 1,
            sheetWidth: 224, // 32 pixels * 7 frames
            sheetHeight: 32
        });
        this.moving = true; // Orbs are always animating/spinning
    }

    update() {
        // You can add logic here if you want orbs to bob up and down
    }
}