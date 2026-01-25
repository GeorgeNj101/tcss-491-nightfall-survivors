const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();
ASSET_MANAGER.queueDownload("./sailormars.png");
ASSET_MANAGER.queueDownload("./marsattack.png");

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

gameEngine.addEntity(new sailormars(gameEngine));
gameEngine.addEntity(new MarsAttack(gameEngine));

	gameEngine.init(ctx);

	gameEngine.start();
});
