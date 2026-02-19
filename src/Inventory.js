const inventory = [];

export default class Inventory {
    constructor(game) {
			this.game = game;
      this.inventory = [];
			this.selectedIndex = -1; // No selection at start
    }

    addItem(item) {
        this.inventory.push(item);
    }

    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
    }

    useItem(item) {

        // Logic to use the item 
    }
		drawInventory() {
			const ctx = this.game.ctx;
			const canvas = this.game.canvas;
	
			const margin = 20;
			const slotSize = 50;
			const spacing = 10;
			const slotsPerRow = 5;
	
			const totalWidth = slotsPerRow * slotSize + (slotsPerRow - 1) * spacing;
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
			for (let i = 0; i < slotsPerRow; i++) {
					const x = startX + i * (slotSize + spacing);
					const y = startY;
	
					ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
					ctx.fillRect(x, y, slotSize, slotSize);
	
					ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
					ctx.strokeRect(x, y, slotSize, slotSize);
	
					// Draw item if exists
					const item = this.inventory[i];
					if (item && item.sprite) {
							ctx.drawImage(
									item.sprite,
									x + 5,
									y + 5,
									slotSize - 10,
									slotSize - 10
							);
					}
			}
	}
	
}