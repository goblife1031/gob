class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.spritesheet('gob', 'assets/sprites/gob.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('slime', 'assets/sprites/slime.png', { frameWidth: 40, frameHeight: 40 });
    this.load.spritesheet('puc', 'assets/sprites/puc.png', { frameWidth: 48, frameHeight: 48 });
    this.load.image('stall', 'assets/sprites/stall.png');
    this.load.image('goo_wall', 'assets/sprites/goo_wall.png');
    this.load.spritesheet('watch', 'assets/sprites/watch.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('rugg', 'assets/sprites/rugg.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('drone', 'assets/sprites/drone.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('vending', 'assets/sprites/vending.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('rat', 'assets/sprites/rat.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('townsfolk', 'assets/sprites/townsfolk.png', { frameWidth: 48, frameHeight: 48 });
    this.load.image('toll_gate', 'assets/sprites/toll_gate.png');
    this.load.spritesheet('wick', 'assets/sprites/wick.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('gargoyle', 'assets/sprites/gargoyle.png', { frameWidth: 48, frameHeight: 48 });
    this.load.image('poster', 'assets/sprites/poster.png');
    this.load.spritesheet('gob_red', 'assets/sprites/gob_red.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('gob_down', 'assets/sprites/gob_down.png');
    this.load.spritesheet('sword_pieces', 'assets/sprites/sword_pieces.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('solgorath_body', 'assets/sprites/solgorath_body.png');
    this.load.image('solgorath_neck', 'assets/sprites/solgorath_neck.png');
    this.load.image('solgorath_claw', 'assets/sprites/solgorath_claw.png');
    this.load.spritesheet('solgorath', 'assets/sprites/solgorath.png', { frameWidth: 192, frameHeight: 160 });
    this.load.spritesheet('conduit', 'assets/sprites/conduit.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('floor_door', 'assets/sprites/floor_door.png', { frameWidth: 64, frameHeight: 32 });
    this.load.image('rugg_stall', 'assets/sprites/rugg_stall.png');
    this.load.image('billboard_debris', 'assets/sprites/billboard_debris.png');
    this.load.image('dragon_placeholder', 'assets/sprites/dragon_placeholder.png');
    this.load.image('tiles', 'assets/tiles/tileset.png');
    this.load.image('title_art', 'assets/art/title.jpg');
    [1, 2, 3, 4].forEach((n) => this.load.image(`skyline_a${n}`, `assets/backdrops/skyline_a${n}.png`));
    [1, 2, 3, 4].forEach((n) => this.load.image(`intro_${n}`, `assets/story/intro_${n}.png`));
    this.load.image('still_standing', 'assets/story/still_standing.png');

    this.add.rectangle(320, 240, 220, 20, 0x2a1540).setStrokeStyle(2, 0x7c3ac6);
    const bar = this.add.rectangle(320 - 108, 240, 4, 14, 0x7c3ac6).setOrigin(0, 0.5);
    this.add.text(320, 210, 'WRATH OF GOB', { fontFamily: 'monospace', fontSize: '20px', color: '#b07ce6' }).setOrigin(0.5);
    this.add.text(320, 270, 'loading...', { fontFamily: 'monospace', fontSize: '12px', color: '#5ad678' }).setOrigin(0.5);
    this.load.on('progress', (value) => { bar.width = 216 * value; });
  }

  create() {
    // small pixel heart, used for the HUD and for heart drops
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff6688, 1);
    [[2, 0, 4, 2], [9, 0, 4, 2], [0, 2, 15, 5], [1, 7, 13, 2], [3, 9, 9, 2], [5, 11, 5, 2], [7, 13, 1, 1]]
      .forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
    g.fillStyle(0xffffff, 0.7).fillRect(3, 3, 2, 2);
    g.generateTexture('heart_pickup', 15, 14);
    g.destroy();

    // a spat can (vending machine projectile) and a cable spark
    const c = this.make.graphics({ x: 0, y: 0, add: false });
    c.fillStyle(0x5ad678, 1).fillRect(1, 0, 8, 10);
    c.fillStyle(0x7c3ac6, 1).fillRect(1, 3, 8, 4);
    c.fillStyle(0xeee7f8, 1).fillRect(2, 0, 6, 1);
    c.generateTexture('can_shot', 10, 10);
    c.clear();
    c.fillStyle(0xe6ff78, 1).fillRect(3, 0, 2, 8).fillRect(0, 3, 8, 2);
    c.generateTexture('spark', 8, 8);
    c.clear();
    // Rugg's "dragon-proof" coin
    c.fillStyle(0x6b4e12, 1).fillCircle(6, 6, 6);
    c.fillStyle(0xe6be46, 1).fillCircle(6, 6, 5);
    c.fillStyle(0xfff0a0, 1).fillRect(4, 3, 2, 5);
    c.generateTexture('coin_shot', 12, 12);
    c.clear();
    // heart container: a big heart in a gold frame
    c.fillStyle(0xe6be46, 1).fillRoundedRect(0, 0, 26, 24, 5);
    c.fillStyle(0x1a0e2a, 1).fillRoundedRect(2, 2, 22, 20, 4);
    c.fillStyle(0xff6688, 1);
    [[6, 6, 5, 3], [15, 6, 5, 3], [4, 8, 18, 5], [5, 13, 16, 2], [7, 15, 12, 2], [9, 17, 8, 2], [12, 19, 2, 1]]
      .forEach(([x, y, w, h]) => c.fillRect(x, y, w, h));
    c.generateTexture('heart_container', 26, 24);
    c.destroy();

    // soft round "hole" used to cut lantern light out of the Area 4 fog
    if (!this.textures.exists('light_hole')) {
      const tex = this.textures.createCanvas('light_hole', 192, 192);
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(96, 96, 10, 96, 96, 96);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.85)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 192, 192);
      tex.refresh();
    }

    GameState.init(this.registry);
    // Dev shortcuts: open the page with #area2 / #area3 / #area4 / #area5 / #roof / #ending to skip ahead.
    const jump = {
      '#area2': 'NeonMarketScene', '#area3': 'BridgeScene', '#area4': 'TowerDistrictScene',
      '#area5': 'TowerClimbScene', '#roof': 'RoofScene', '#ending': 'EndingScene',
    }[window.location.hash];
    if (window.location.hash === '#dev') Dev.setEnabled(true);
    if (jump) {
      GameState.devPrep(this.registry, jump);
      this.scene.start(jump);
      return;
    }
    this.scene.start('TitleScene');
  }
}
