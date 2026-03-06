import Entity from "./Entity.js";

export default class ChickenEnemy extends Entity {
    constructor(camera) {
        super(camera, {
            imagePath: "assets/Chicken_Enemy.png",
            radius: 40,
            maxHp: 15,
            speed:3,   // Chickens are fast!
            damage: 10
        });
    }
}