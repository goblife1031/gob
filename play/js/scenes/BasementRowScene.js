// AREA 1 — BASEMENT ROW (the quick tutorial). Per the Lore Book: Gob
// comes up through the basement crack at the south end of a wrecked
// Mintport street, meets Puc at her stall, gets a real sword, hacks through
// the goo plugging the cart barricade, and heads north toward the S Corp
// tower on the skyline. The dragon is only a shape behind the tower here.
//
// Teaches, in order: move -> talk (SPACE near Puc) -> swing (SPACE) ->
// fight slimes that crawl out of gutter pools.

const A1_COLS = 20;
const A1_ROWS = 34;
const A1_SKY_ROWS = 4;          // rows 0-3: distant skyline backdrop, not walkable
const A1_BARRICADE_ROW = 20;
const A1_ROAR_ROW = 9;
// tile indices (see tools/generate_placeholder_art.py)
const T = {
  ASPHALT: 4, SIDEWALK: 5, BUILDING: 6, POOL: 7, CART: 8, LANE: 9,
  PLAZA: 10, DEAD_BB: 11, NEON_BB: 12, CABLE: 13, CRATE: 14, STALL: 15,
  DECK: 16, RAIL: 17, RIVER: 18, GAP: 19,
  MARBLE: 20, LAMP: 21, TOWER: 22,
  GLASS: 23, ELEV: 24, DESK: 25, RACK: 26, ROOF: 27, LEDGE: 28,
};

class BasementRowScene extends AreaScene {
  constructor() {
    super('BasementRowScene');
  }

  create() {
    this.initArea();
    this.flags = { moved: false, talkedToPuc: !!this.registry.get('hasSword'), swung: false, gooCleared: false, roared: false };

    const W = A1_COLS * TILE;
    const H = A1_ROWS * TILE;
    this.drawSkyline(W, A1_SKY_ROWS, 0, 'skyline_a1');
    this.buildMap();
    this.drawCrack();
    this.physics.world.setBounds(0, A1_SKY_ROWS * TILE, W, H - A1_SKY_ROWS * TILE);
    this.cameras.main.setBounds(0, 0, W, H);

    this.player = new Player(this, W / 2, 31 * TILE + 8);
    this.physics.add.collider(this.player, this.layer);

    this.buildPuc();
    this.buildGooWall();
    this.buildSlimes();
    this.buildPickups();
    this.buildExit();

    this.player.on('moved', () => {
      if (!this.flags.moved) {
        this.flags.moved = true;
        if (!this.flags.talkedToPuc) this.think('Someone waving up the street. Gob go see.');
      }
    });
    this.player.on('swing', () => {
      if (!this.flags.swung) { this.flags.swung = true; if (!this.flags.gooCleared) this.think('Goo plugging the carts. Sword cut goo.'); }
    });

    this.finishArea('AREA 1', 'BASEMENT ROW',
      this.flags.talkedToPuc ? { think: 'Tower is north. Gob go north.' } : 'WASD / arrow keys to move');
  }

  // ---------- world ----------

  buildMap() {
    const data = [];
    for (let y = 0; y < A1_ROWS; y++) {
      const row = [];
      for (let x = 0; x < A1_COLS; x++) {
        let t;
        if (y < A1_SKY_ROWS) t = -1;                                  // skyline backdrop shows through
        else if (y === A1_SKY_ROWS) t = (x >= 8 && x <= 11) ? T.ASPHALT : T.BUILDING; // north exit gap
        else if (y === A1_ROWS - 1) t = T.BUILDING;                    // basement wall (the crack is here)
        else if (x <= 1 || x >= 18) t = T.BUILDING;
        else if (x <= 3 || x >= 16) t = T.SIDEWALK;
        else t = (x === 9 && y % 2 === 0) ? T.LANE : T.ASPHALT;
        row.push(t);
      }
      data.push(row);
    }
    // the cart barricade across the street; the 2-tile gap is plugged with goo
    for (let x = 2; x <= 17; x++) if (x !== 9 && x !== 10) data[A1_BARRICADE_ROW][x] = T.CART;
    // scattered abandoned carts
    [[6, 24], [13, 27], [14, 14], [5, 16], [7, 12], [12, 8]].forEach(([x, y]) => { data[y][x] = T.CART; });
    // gutter slime pools: slimes crawl out of these (all north of the barricade)
    this.poolCells = [[3, 15], [16, 11], [3, 7], [16, 17]];
    this.poolCells.forEach(([x, y]) => { data[y][x] = T.POOL; });

    this.buildTilemap(data, [2, 3, T.BUILDING, T.POOL, T.CART]);
  }

  drawCrack() {
    // the crack in the basement wall Gob just squeezed out of
    const g = this.add.graphics().setDepth(1);
    const by = (A1_ROWS - 1) * TILE;
    g.lineStyle(4, 0x5ad678, 0.9);
    g.beginPath();
    g.moveTo(312, by + 32); g.lineTo(322, by + 20); g.lineTo(314, by + 10); g.lineTo(326, by);
    g.strokePath();
    g.fillStyle(0x5ad678, 0.18).fillCircle(320, by + 14, 22);
  }

  // ---------- Puc ----------

  buildPuc() {
    const stallX = 3 * TILE;          // straddles the left sidewalk
    const stallY = 26 * TILE;
    this.stall = this.add.image(stallX, stallY, 'stall').setDepth(5);
    const stallBody = this.add.zone(stallX, stallY + 8, 60, 44);
    this.physics.add.existing(stallBody, true);
    this.physics.add.collider(this.player, stallBody);

    this.puc = this.add.sprite(stallX + 50, stallY + 6, 'puc', 0).setDepth(9).setOrigin(0.5, NPC48_ORIGIN_Y);
    this.puc.anims.play('puc_idle');
    this.physics.add.existing(this.puc, true);
    this.puc.body.setSize(18, 14).setOffset(15, 34);
    this.physics.add.collider(this.player, this.puc);

    this.pucCall = this.add.text(this.puc.x, this.puc.y - 30, 'Psst! Over here!', {
      fontFamily: 'monospace', fontSize: '10px', color: '#4de1ff', backgroundColor: '#1a0e2acc', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.addNpc(this.puc, () => this.pucLines(), () => {
      if (!this.flags.talkedToPuc) {
        this.flags.talkedToPuc = true;
        this.setHint('SPACE to swing your sword.');
      }
    });
  }

  nearPuc() {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.puc.x, this.puc.y) < 56;
  }

  pucLines() {
    if (this.flags.talkedToPuc) {
      return [{ who: 'Puc', text: "Go on. Gob go north, right? ...Come back in one piece. I'm not giving you a second sword." }];
    }
    return [
      { who: 'Puc', text: 'Whoa, easy! You came out of THAT crack? Nobody comes up out of the basements.' },
      { who: 'Puc', text: "Name's Puc. This was my stall. Was. Then the sky went green and the gutters started... moving." },
      { who: 'Puc', text: "Folks are calling whatever's behind it the wen dragon. As in: wen's it coming for the rest of us?" },
      { who: 'Gob', text: 'Gob go north.' },
      { who: 'Puc', text: "North? Toward the S tower? You're out of your mind. ...Hold on." },
      { who: 'Puc', text: 'Your eyes. Same green as that gunk in the gutters. Huh. ...Probably nothing.' },
      { who: 'Puc', text: 'Here, take this. Better you swing it than I sell it. Nobody is buying anything tonight.' },
      {
        who: null,
        text: 'Gob got a SWORD!\nSPACE to swing.',
        onShow: () => {
          this.registry.set('hasSword', true);
          this.cameras.main.flash(250, 176, 124, 230);
        },
      },
      { who: 'Puc', text: "Goo's plugging the gap in the carts up the street. Hack through it. And watch the gutters." },
    ];
  }

  // ---------- the goo gate ----------

  buildGooWall() {
    this.goo = null;
    if (this.registry.get('a1GooCleared')) { this.flags.gooCleared = true; return; }
    const gx = 10 * TILE;
    const gy = A1_BARRICADE_ROW * TILE + 16;
    this.goo = this.physics.add.staticImage(gx, gy, 'goo_wall').setDepth(6);
    this.goo.hp = 3;
    this.goo.lastSwingId = -1;
    this.physics.add.collider(this.player, this.goo);
    this.physics.add.overlap(this.player.attackHitbox, this.goo, () => this.hitGoo());
  }

  hitGoo() {
    const goo = this.goo;
    if (!goo || !goo.active || goo.lastSwingId === this.player.swingId) return;
    goo.lastSwingId = this.player.swingId;
    goo.hp -= 1;
    this.splat(goo.x + Phaser.Math.Between(-16, 16), goo.y, 0x5ad678);
    this.tweens.add({ targets: goo, scaleX: 1.08, scaleY: 0.9, duration: 70, yoyo: true });
    goo.setAlpha(0.45 + 0.18 * goo.hp);
    if (goo.hp <= 0) {
      for (let i = 0; i < 5; i++) this.splat(goo.x + Phaser.Math.Between(-28, 28), goo.y + Phaser.Math.Between(-10, 10), 0x5ad678);
      goo.destroy();
      this.goo = null;
      this.flags.gooCleared = true;
      this.registry.set('a1GooCleared', true);
      this.think('Way open. Gutters still bubbling...');
    }
  }

  // ---------- slimes ----------

  buildSlimes() {
    this.slimes = this.physics.add.group();
    this.spawnedCount = 0;
    this.maxSpawns = 9;      // total gutter spawns this visit (not counting the first three)
    this.maxAlive = 4;
    this.nextSpawnAt = 0;

    [[8, 16], [12, 12], [6, 9]].forEach(([cx, cy]) => this.addSlime(cx * TILE + 16, cy * TILE + 16));

    this.physics.add.collider(this.slimes, this.layer);
    this.physics.add.collider(this.slimes, this.slimes);
    this.physics.add.collider(this.player, this.slimes, (player, slime) => {
      player.takeDamage(1, slime.x, slime.y);
      slime.recoil(player.x, player.y);
    });
    this.physics.add.overlap(this.player.attackHitbox, this.slimes, (hitbox, slime) => {
      if (slime.takeHit(this.player.swingId, this.player.x, this.player.y)) {
        this.splat(slime.x, slime.y, 0x5ad678);
        this.maybeDropHeart(slime.x, slime.y);
      }
    });
    if (this.goo) this.physics.add.collider(this.slimes, this.goo);
  }

  addSlime(x, y) {
    const s = new Slime(this, x, y);
    this.slimes.add(s);
    return s;
  }

  updateSpawns(time) {
    if (this.player.y > A1_BARRICADE_ROW * TILE) return;  // only once Gob is past the barricade
    if (time < this.nextSpawnAt || this.spawnedCount >= this.maxSpawns) return;
    if (this.slimes.countActive(true) >= this.maxAlive) return;
    const pools = this.poolCells
      .map(([cx, cy]) => ({ x: cx * TILE + 16, y: cy * TILE + 16, cx }))
      .map((p) => ({ ...p, d: Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y) }))
      .filter((p) => p.d > 110)
      .sort((a, b) => a.d - b.d);
    if (!pools.length) return;
    const p = pools[0];
    const sx = p.cx < 10 ? p.x + 34 : p.x - 34;  // crawl out toward the street
    this.addSlime(sx, p.y).emerge();
    this.splat(p.x, p.y, 0x5ad678);
    this.spawnedCount += 1;
    this.nextSpawnAt = time + Phaser.Math.Between(3200, 4800);
  }

  // ---------- story beats ----------

  roar() {
    this.flags.roared = true;
    this.player.frozen = true;
    this.cameras.main.shake(900, 0.012);
    this.cameras.main.flash(300, 90, 214, 120);
    this.dragonShadow.setPosition(250, 74).setAlpha(0);
    this.tweens.add({
      targets: this.dragonShadow, alpha: 0.9, x: 390, duration: 1800, ease: 'Sine.InOut',
      onComplete: () => this.tweens.add({ targets: this.dragonShadow, alpha: 0, duration: 900 }),
    });
    this.time.delayedCall(1100, () => {
      this.playDialogue([
        { who: null, text: 'Somewhere behind the S tower, something enormous turns over in its sleep.' },
        { who: 'Gob', text: '...Gob go anyway.' },
      ], () => this.think('North.'));
    });
  }

  buildExit() {
    const zone = this.add.zone(10 * TILE, A1_SKY_ROWS * TILE + 12, 4 * TILE, 20);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.player.isDead) return;
      GameState.goTo(this, 'NeonMarketScene');
    });
  }

  update(time) {
    if (!this.player.isDead) this.player.update();
    this.slimes.getChildren().forEach((s) => s.update(time, this.player));
    this.updateSpawns(time);
    if (!this.flags.roared && this.flags.gooCleared && this.player.y < A1_ROAR_ROW * TILE) this.roar();
    const near = this.nearPuc();
    const callRange = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.puc.x, this.puc.y) < 220;
    this.pucCall.setVisible(!this.flags.talkedToPuc && !near && callRange && !this.dialogue.open);
    this.updateHud();
  }
}
