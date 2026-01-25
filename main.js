const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();
ASSET_MANAGER.queueDownload("./player_down.png");
ASSET_MANAGER.queueDownload("./player_up.png");
ASSET_MANAGER.queueDownload("./player_right.png");
ASSET_MANAGER.queueDownload("./player_left.png");


ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

const player = new Player(gameEngine); 
gameEngine.addEntity(player);

	gameEngine.init(ctx);

	gameEngine.start();
});
