export default class ItemObject {
	constructor(image, type, name, description, effect, stats = {}) {
		this.image = image;
		this.type = type;          // "weapon", "consumable", "passive", etc.
		this.name = name;
		this.description = description;
		this.effect = effect;      // function(game) { ... } or null
		this.stats = stats;        // weapon stats, heal amount, etc.
	}
}
