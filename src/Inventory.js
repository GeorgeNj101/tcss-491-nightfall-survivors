export default class Inventory {
    constructor(game) {
			this.game = game;
      this.inventory = [];
			this.maxSlots = 5;
			this.selectedIndex = -1; // No selection at start
    }

    addItem(itemObject) {
        this.inventory.push(itemObject);
    }

    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
    }

    useItem(item) {
			if (typeof item.effect === 'function') {
				item.effect(this.game);
			}
			this.removeItem(item);
    }

		selectItem(index) {
			this.selectedIndex = index;
		  const selectedItem = this.inventory[index];
			if (!selectedItem) return;

			if (selectedItem.type === "weapon") {
				this.game.currentWeapon = selectedItem;
				
			} else {
				this.useItem(selectedItem);
			}
		}

		drawInventory() {
			const ctx = this.game.ctx;
			const canvas = this.game.canvas;
	
			const margin = 20;
			const slotSize = 50;
			const spacing = 10;
	
			const totalWidth = this.maxSlots * slotSize + (this.maxSlots - 1) * spacing;
			const totalHeight = slotSize;
	
			// Bottom-left anchored position
			const startX = margin;
			const startY = canvas.height - totalHeight - margin;
	
			// --- Background box ---
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(
					startX - 10,
					startY - 10,
					totalWidth + 20,
					totalHeight + 20
			);
	
			// --- Draw slots ---
			for (let i = 0; i < this.maxSlots; i++) {
					const x = startX + i * (slotSize + spacing);
					const y = startY;
	
					ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
					ctx.fillRect(x, y, slotSize, slotSize);
	
					ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
					ctx.strokeRect(x, y, slotSize, slotSize);
	
					// Draw item if exists
					const item = this.inventory[i];
					if (item && item.image && item.image.complete) {
							ctx.drawImage(
									item.image,
									x + 5,
									y + 5,
									slotSize - 10,
									slotSize - 10
							);
					}

					// Type indicator border color
					if (item) {
							ctx.strokeStyle = item.type === "weapon" ? "rgba(255, 100, 100, 0.8)"
							                : item.type === "consumable" ? "rgba(100, 255, 100, 0.8)"
							                : "rgba(255, 255, 255, 0.3)";
							ctx.lineWidth = 2;
							ctx.strokeRect(x, y, slotSize, slotSize);
					}
			}
	}
	
}