export default class ItemObject {
	constructor(frame, image, projectileSprite, type, name, description, effect, stats = {}) {
		this.image = image;
		this.projectileSprite = projectileSprite; // Image for the projectile this weapon fires (or null)
		this.type = type;          // "weapon", "consumable", "passive", etc.
		this.name = name;
		this.description = description;
		this.effect = effect;      // function(game) { ... } or null
		this.stats = stats;        // weapon stats, heal amount, etc.
		this.frame = frame;
		this.frameWidth=1;

		this.image.onload = () => {
			this.loaded = true;
			// Optional: Recalculate frame size if image is different than expected
			this.frameWidth = this.image.width / this.frame;
		}
	}
}
