const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  parent: 'game-container',
  backgroundColor: '#140a20',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, IntroScene, BasementRowScene, NeonMarketScene, BridgeScene, TowerDistrictScene, TowerClimbScene, RoofScene, EndingScene, ComingSoonScene, PauseScene],
};

function startGame() {
  window.__wogGame = new Phaser.Game(config); // debug/test handle
}

// Supports the viewer's hot-update hook when this page is already open;
// falls back to a plain start otherwise (e.g. the very first load).
if (window.claude && window.claude.hot) {
  window.claude.hot.ready ? window.claude.hot.ready(startGame) : startGame();
} else {
  window.addEventListener('load', startGame);
}
