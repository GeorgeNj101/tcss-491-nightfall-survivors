export default class Inventory {
    constructor(game) {
        this.game = game;
        this.inventory = [];
        this.maxSlots = 5;
        this.equippedIndex = -1; // Index of currently equipped weapon

        // Slot layout (cached for click detection)
        this.margin = 20;
        this.slotSize = 50;
        this.spacing = 10;
    }

    addItem(itemObject) {
        this.inventory.push(itemObject);
    }

    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            // If we removed the equipped item, unequip
            if (index === this.equippedIndex) {
                this.equippedIndex = -1;
                this.game.currentWeapon = null;
            } else if (index < this.equippedIndex) {
                this.equippedIndex--; // shift index down
            }
            this.inventory.splice(index, 1);
        }
    }

    useItem(item) {
        if (typeof item.effect === 'function') {
            item.effect(this.game);
        }
        this.removeItem(item);
    }

    /** Called when player clicks an inventory slot */
    selectItem(index) {
        const selectedItem = this.inventory[index];
        if (!selectedItem) return;

        if (selectedItem.type === "weapon") {
            // Toggle equip: click again to unequip
            if (this.equippedIndex === index) {
                this.equippedIndex = -1;
                this.game.currentWeapon = null;
            } else {
                this.equippedIndex = index;
                this.game.currentWeapon = selectedItem;
            }
        } else if (selectedItem.type === "consumable") {
            this.useItem(selectedItem);
        }
        // passives do nothing on click (already applied)
    }

    /** Returns the slot index at screen position (mx, my), or -1 */
    getSlotAt(mx, my) {
        const canvas = this.game.canvas;
        const startX = this.margin;
        const startY = canvas.height - this.slotSize - this.margin;

        for (let i = 0; i < this.maxSlots; i++) {
            const x = startX + i * (this.slotSize + this.spacing);
            if (mx >= x && mx <= x + this.slotSize &&
                my >= startY && my <= startY + this.slotSize) {
                return i;
            }
        }
        return -1;
    }

    /** Call from game click handler */
    handleClick(mx, my) {
        const slot = this.getSlotAt(mx, my);
        if (slot >= 0) {
            this.selectItem(slot);
        }
    }

    drawInventory() {
        const ctx = this.game.ctx;
        const canvas = this.game.canvas;

        const startX = this.margin;
        const startY = canvas.height - this.slotSize - this.margin;

        const totalWidth = this.maxSlots * this.slotSize + (this.maxSlots - 1) * this.spacing;

        // --- Background box ---
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(startX - 10, startY - 10, totalWidth + 20, this.slotSize + 20);

        // --- Draw slots ---
        for (let i = 0; i < this.maxSlots; i++) {
            const x = startX + i * (this.slotSize + this.spacing);
            const y = startY;

            // Slot background
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.fillRect(x, y, this.slotSize, this.slotSize);

            // Default border
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, this.slotSize, this.slotSize);

            const item = this.inventory[i];

            // Draw item icon (sprite-sheet animation)
            if (item && item.image && item.image.complete) {
                let cardX = item.frameWidth;
                let cardFrame = this.game.gameFrame % item.frame;
                ctx.drawImage(
                    item.image,
                    cardX * cardFrame, 0, cardX, item.image.height,
                    x + 5, y + 5, this.slotSize - 10, this.slotSize - 10
                );
            }

            // Type-colored border
            if (item) {
                ctx.strokeStyle = item.type === "weapon" ? "rgba(255, 100, 100, 0.8)"
                    : item.type === "consumable" ? "rgba(100, 255, 100, 0.8)"
                    : "rgba(150, 150, 255, 0.8)";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, this.slotSize, this.slotSize);
            }

            // Equipped highlight (bright gold border + "E" label)
            if (i === this.equippedIndex) {
                ctx.strokeStyle = "rgba(255, 215, 0, 1)";
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 1, y - 1, this.slotSize + 2, this.slotSize + 2);

                ctx.fillStyle = "gold";
                ctx.font = "bold 12px Arial";
                ctx.textAlign = "right";
                ctx.fillText("E", x + this.slotSize - 3, y + 12);
            }

            // Slot number label
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "11px Arial";
            ctx.textAlign = "left";
            ctx.fillText(i + 1, x + 3, y + 12);
        }
    }
}