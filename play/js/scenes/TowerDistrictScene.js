// AREA 4 — THE TOWER DISTRICT. Per the Lore Book: the Watch, who hunted Gob
// in the market, surround him, then stand down (Captain Wick's brother was
// on the bridge). "We hold to truth and light." They escort Gob through the
// corruption fog toward the S tower: their lanterns, the danger in Area 2,
// are now his shelter. Wick teaches the CHARGED SWING at a gargoyle. At the
// foot of the tower the lanterns gutter out, Solgorath's eye opens, Tam
// swears "By the Holders...", Wick hushes him, Gob wonders what power the
// Holders hold, and goes on alone: "Gob be back."
//
// Mechanics: fog burns Gob outside lantern light (an exposure meter fills,
// then costs a heart); corrupted creatures caught in the light freeze;
// gargoyles only break to a charged strike. The squad advances in stages,
// holding each position while Gob clears the way ahead.

const A4_COLS = 20;
const A4_ROWS = 50;
const A4_SKY_ROWS = 4;
const A4_GATE_ROW = 33;
const A4_RING_ROW = 44;
const A4_WAYPOINTS = [            // Wick's position for each stage
  { x: 320, y: 37 * TILE },       // 0: before the gargoyle gate (charged-swing lesson)
  { x: 320, y: 29 * TILE },       // 1
  { x: 320, y: 21 * TILE },       // 2
  { x: 320, y: 13 * TILE + 16 },  // 3: edge of the tower plaza
  { x: 320, y: 11 * TILE },       // 4: foot of the tower (lights gutter)
];
const A4_STAGE_ENEMIES = [
  [],
  [['slime', 7, 24], ['slime', 12, 23], ['rat', 5, 26], ['rat', 14, 25], ['rat', 10, 22]],
  [['garg', 6, 17], ['garg', 13, 16], ['rat', 9, 15], ['rat', 4, 18], ['rat', 15, 18]],
  [['garg', 5, 9], ['garg', 14, 9], ['slime', 8, 7], ['slime', 11, 7], ['rat', 4, 11], ['rat', 15, 11]],
];
const A4_FOG_COLOR = 0x0a2412;

class TowerDistrictScene extends AreaScene {
  constructor() {
    super('TowerDistrictScene');
  }

  create() {
    this.initArea();
    this.registry.set('hasSword', true);
    this.registry.set('hasDash', true);
    // reset run-time state (Phaser reuses this object on restart)
    this.stage = this.registry.get('a4RingSeen') ? this.registry.get('a4Stage') : -1;
    this.stageSpawned = false;
    this.stageCleared = false;
    this.moving = false;
    this.exposure = 0;
    this.fogAlpha = 0.8;
    this.alone = false;
    this.busy = false;
    this.warnedFog = false;
    this.flags = { ringSeen: !!this.registry.get('a4RingSeen'), lesson: !!this.registry.get('hasCharge') };

    const W = A4_COLS * TILE;
    const H = A4_ROWS * TILE;
    this.drawSkyline(W, A4_SKY_ROWS, 1, 'skyline_a4');
    this.buildEye();
    this.buildMap();
    this.physics.world.setBounds(0, A4_SKY_ROWS * TILE, W, H - A4_SKY_ROWS * TILE);
    this.cameras.main.setBounds(0, 0, W, H);

    let sx = W / 2; let sy = 47 * TILE;
    if (this.stage >= 0) { const wp = A4_WAYPOINTS[this.stage]; sx = wp.x; sy = wp.y + 52; }
    this.player = new Player(this, sx, sy);
    this.player.direction = 'up';
    this.physics.add.collider(this.player, this.layer);

    this.buildPickups();
    this.buildEnemies();
    this.buildGate();
    this.buildPoster();
    this.buildSquad();
    this.buildDoor();
    this.buildFog();

    let hint = { think: 'Big S. Right there. Fog thick.' };
    if (this.stage >= 0) hint = { think: 'Fog burn. Lantern light safe.' };
    this.finishArea('AREA 4', 'TOWER DISTRICT', hint);
  }

  // ---------- world ----------

  buildMap() {
    const data = [];
    for (let y = 0; y < A4_ROWS; y++) {
      const row = [];
      for (let x = 0; x < A4_COLS; x++) {
        let t;
        if (y < A4_SKY_ROWS) t = -1;
        else if (y === A4_SKY_ROWS) t = (x === 9 || x === 10) ? T.MARBLE : T.TOWER;   // the tower's door
        else if (y === A4_ROWS - 1) t = T.BUILDING;
        else if (y <= 12) t = (x === 0 || x === 19) ? T.TOWER : T.MARBLE;            // tower plaza
        else if (x <= 1 || x >= 18) t = T.BUILDING;
        else if (x <= 3 || x >= 16) t = ((x === 3 || x === 16) && y % 5 === 0) ? T.LAMP : T.SIDEWALK;
        else t = (x === 9 && y % 2 === 0) ? T.LANE : T.ASPHALT;
        row.push(t);
      }
      data.push(row);
    }
    // the barricade: carts across the avenue, a dormant gargoyle in the gap
    for (let x = 2; x <= 17; x++) if (x !== 9 && x !== 10) data[A4_GATE_ROW][x] = T.CART;
    [[6, 27], [13, 26], [5, 19], [14, 20], [7, 12], [12, 12]].forEach(([x, y]) => { data[y][x] = T.CRATE; });
    this.buildTilemap(data, [2, 3, T.BUILDING, T.CART, T.CRATE, T.LAMP, T.TOWER]);
  }

  buildEye() {
    // Solgorath's eye, opening behind the tower when the lanterns die
    this.eye = this.add.container(320, 70).setDepth(60).setAlpha(0);
    const white = this.add.ellipse(0, 0, 86, 34, 0xd8ff6a, 1).setStrokeStyle(3, 0x1a3a10);
    const glow = this.add.ellipse(0, 0, 120, 54, 0x96ffaa, 0.18);
    const pupil = this.add.ellipse(0, 0, 10, 30, 0x050805, 1);
    this.eye.add([glow, white, pupil]);
    this.eye.setScale(1, 0.05);
  }

  buildGate() {
    this.gateGarg = null;
    if (this.stage > 0) return;
    this.gateGarg = new Gargoyle(this, 10 * TILE, A4_GATE_ROW * TILE + 12, true);
    this.physics.add.collider(this.player, this.gateGarg);
    this.physics.add.overlap(this.player.attackHitbox, this.gateGarg, () => {
      if (!this.player.isAttacking || !this.gateGarg) return;
      if (this.gateGarg.takeHit(this.player.swingId, this.player.x, this.player.y, 3, this.player.strikeCharged)) {
        this.gateGarg = null;
        this.cameras.main.shake(200, 0.01);
        this.stageDone(0);
      } else if (!this.player.strikeCharged && this.player.hasCharge) {
        this.setHint('Hold SPACE until the aura flashes, then let go.');
      }
    });
  }

  buildPoster() {
    const p = this.physics.add.staticImage(3 * TILE + 16, 31 * TILE, 'poster').setDepth(6);
    p.body.setSize(10, 12).setOffset(11, 30);
    this.physics.add.collider(this.player, p);
    this.addNpc(p, () => [
      { who: null, text: 'WANTED: RUGG\nFraud, counterfeit coin, and general rugging.' },
      { who: 'Gob', text: 'Gob know.' },
    ], null, 'SPACE: read');
  }

  buildDoor() {
    this.doorSeal = this.physics.add.staticImage(10 * TILE, A4_SKY_ROWS * TILE + 16, 'goo_wall').setDepth(6);
    this.doorSeal.setTint(0x6a6a7a);
    this.physics.add.collider(this.player, this.doorSeal);
    const zone = this.add.zone(10 * TILE, A4_SKY_ROWS * TILE + 8, 2 * TILE, 12);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.player.isDead || !this.alone || this.doorSeal) return;
      GameState.goTo(this, 'TowerClimbScene');
    });
  }

  // ---------- the Watch squad ----------

  buildSquad() {
    this.wick = new WatchAlly(this, 0, 0, 'wick', 'Wick');
    this.tam = new WatchAlly(this, 0, 0, 'watch', 'Tam');
    this.bram = new WatchAlly(this, 0, 0, 'watch', 'Bram');
    this.squad = [this.wick, this.tam, this.bram];
    if (this.stage < 0) {
      this.squad.forEach((a) => a.setVisible(false).setPosition(-100, -100));
      this.squad.forEach((a) => { a.lightR = 0; });
    } else {
      this.placeSquad(A4_WAYPOINTS[this.stage], true);
      if (this.stage === 4) this.moving = true;          // already there: replay the lanterns-out scene
      else if (this.stage > 0) { this.moving = false; this.beginStage(); }
    }
  }

  formation(wp) {
    return [
      { a: this.wick, x: wp.x, y: wp.y },
      { a: this.tam, x: wp.x - 62, y: wp.y + 18 },
      { a: this.bram, x: wp.x + 62, y: wp.y + 18 },
    ];
  }

  placeSquad(wp, instant) {
    this.formation(wp).forEach(({ a, x, y }) => {
      if (instant) { a.setPosition(x, y); a.target = null; } else a.moveTo(x, y);
    });
  }

  advanceTo(stage) {
    this.stage = stage;
    this.registry.set('a4Stage', stage);
    this.stageSpawned = false;
    this.stageCleared = false;
    this.moving = true;
    this.placeSquad(A4_WAYPOINTS[stage], false);
    if (stage > 0 && stage < 4) this.bark(this.wick, ['Move up! Stay in the light!'], '#ffdc78', 1600);
  }

  beginStage() {
    this.stageSpawned = true;
    const list = A4_STAGE_ENEMIES[this.stage] || [];
    list.forEach(([kind, cx, cy]) => {
      const x = cx * TILE + 16; const y = cy * TILE + 16;
      let e;
      if (kind === 'garg') {
        e = new Gargoyle(this, x, y, false);
        e.setAlpha(0);
        this.tweens.add({ targets: e, alpha: 1, duration: 500 });
        e.stunUntil = this.time.now + 900;
      } else {
        e = kind === 'rat' ? new Rat(this, x, y) : new Slime(this, x, y);
        e.emerge();
      }
      // corrupted things are drawn to the Watch's light: they come at the
      // squad, freeze when they reach it, and Gob cuts them down
      e.goal = this.wick;
      this.enemies.add(e);
    });
    if (list.length) {
      const lines = { 1: 'Hold here! Clear the way, Gob!', 2: 'Gargoyles! Hit them hard, little one!', 3: 'Last push! Get us to that tower!' };
      this.bark(this.wick, [lines[this.stage]], '#ffdc78', 2200);
    }
  }

  stageDone(stage) {
    if (stage === 0) {
      this.bark(this.wick, ['Good. Now you hit like the Watch.'], '#ffdc78', 1800);
      // the gargoyle crumbles around a heart container (16 -> 18 hearts by the dragon)
      if (!this.registry.get('a4Container')) {
        this.registry.set('a4Container', true);
        const gx = 10 * TILE; const gy = A4_GATE_ROW * TILE + 12;
        this.time.delayedCall(600, () => this.spawnHeartContainer(gx, gy));
      }
    }
    this.time.delayedCall(stage === 0 ? 1200 : 700, () => this.advanceTo(stage + 1));
  }

  updateSquad(time, delta) {
    this.squad.forEach((a) => a.update(delta));
    if (this.stage < 0 || this.busy) return;
    if (this.moving && this.squad.every((a) => a.arrived)) {
      this.moving = false;
      if (this.stage === 4) this.lightsGutter();
      else if (this.stage > 0) this.beginStage();
    }
    if (this.stage >= 1 && this.stage <= 3 && this.stageSpawned && !this.stageCleared && this.enemies.countActive(true) === 0) {
      this.stageCleared = true;
      this.stageDone(this.stage);
    }
    // the charged-swing lesson
    if (this.stage === 0 && !this.flags.lesson && this.gateGarg && !this.moving
      && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.gateGarg.x, this.gateGarg.y) < 110) {
      this.chargeLesson();
    }
  }

  // ---------- story beats ----------

  ringScene() {
    this.busy = true;
    this.player.frozen = true;
    const px = this.player.x; const py = this.player.y;
    const spots = [[this.wick, 0, -78], [this.tam, -70, 30], [this.bram, 70, 30]];
    spots.forEach(([a, dx, dy], i) => {
      a.setVisible(true).setAlpha(0).setPosition(px + dx * 1.6, py + dy * 1.6);
      a.setFlipX(dx > 0);
      a.moveTo(px + dx, py + dy);
      this.tweens.add({ targets: a, alpha: 1, duration: 500, delay: i * 150 });
      this.tweens.add({ targets: a, lightR: 92, duration: 700, delay: i * 150 });
    });
    this.time.delayedCall(900, () => this.bark(this.tam, ["That's the one from the market! Green eyes, can't miss it!"], '#ffdc78', 2000));
    this.time.delayedCall(2600, () => {
      this.playDialogue([
        { who: 'Captain Wick', text: 'Stand down. Lanterns low.' },
        { who: 'Captain Wick', text: 'My brother was on that bridge. Says a little thing with green eyes held the line when the river came up. That you?' },
        { who: 'Gob', text: 'Gob hold line.' },
        { who: 'Captain Wick', text: "The Watch doesn't owe monsters anything. But we pay our debts." },
        { who: 'Captain Wick', text: "We hold to truth and light, little one. Even when there's not much of either left. Walk with us." },
      ], () => {
        this.registry.set('a4RingSeen', true);
        this.flags.ringSeen = true;
        this.busy = false;
        this.advanceTo(0);
        this.think('Fog burn. Lantern light safe. Gob stay close.');
      });
    });
  }

  chargeLesson() {
    this.flags.lesson = true;
    this.playDialogue([
      { who: 'Captain Wick', text: "Stone doesn't care how fast you swing. Hold it. Let it build. Then let go." },
      {
        who: null,
        text: 'Gob learned CHARGED SWING!\nHold SPACE until the aura flashes, then release.',
        onShow: () => { this.registry.set('hasCharge', true); this.cameras.main.flash(250, 176, 124, 230); },
      },
    ], () => this.setHint('Break the gargoyle: hold SPACE, wait for the flash, release.'));
  }

  lightsGutter() {
    this.busy = true;
    this.player.frozen = true;
    this.enemies.clear(true, true);
    this.setHint('');
    // the lanterns flicker and die one by one
    this.squad.forEach((a, i) => {
      this.time.delayedCall(i * 700, () => {
        this.tweens.add({ targets: a, lightR: 30, duration: 90, yoyo: true, repeat: 3, onComplete: () => {
          this.tweens.add({ targets: a, lightR: 0, duration: 500 });
        } });
      });
    });
    this.tweens.add({ targets: this, fogAlpha: 0.9, duration: 2400 });
    this.time.delayedCall(2600, () => {
      this.cameras.main.stopFollow();
      this.cameras.main.pan(320, 150, 1200, 'Sine.easeInOut');
      this.dragonShadow.setPosition(320, 80).setAlpha(0).setScale(1.6);
      this.tweens.add({ targets: this.dragonShadow, alpha: 0.95, duration: 1200 });
      this.tweens.add({ targets: this.eye, alpha: 1, duration: 600, delay: 900 });
      this.tweens.add({ targets: this.eye, scaleY: 1, duration: 900, delay: 1100, ease: 'Sine.Out' });
      this.time.delayedCall(1400, () => this.cameras.main.shake(700, 0.006));
    });
    this.time.delayedCall(4800, () => {
      this.playDialogue([
        { who: 'Tam', text: "By the Holders... that's a big dragon." },
        { who: 'Captain Wick', text: "Don't swear by them lightly, Tam. Not here." },
        { note: true, text: 'Watch say "Holders" like a prayer. Dragon right there, and still they whisper the name. What power Holders hold? Gob wonder.' },
        { who: 'Captain Wick', text: "This is as far as the light goes. If you come back down... the Watch will remember." },
        { who: 'Gob', text: 'Gob be back.' },
      ], () => {
        this.alone = true;
        this.busy = false;
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.tweens.add({ targets: this.eye, scaleY: 0.05, alpha: 0, duration: 700, delay: 400 });
        this.tweens.add({ targets: this.dragonShadow, alpha: 0, duration: 900 });
        if (this.doorSeal) {
          const s = this.doorSeal; s.body.enable = false; this.doorSeal = null;
          this.tweens.add({ targets: s, alpha: 0, duration: 600, onComplete: () => s.destroy() });
        }
        this.tweens.add({ targets: this, fogAlpha: 0.7, duration: 1200 });
        this.think('Light stop here. Gob go alone.');
      });
    });
  }

  // ---------- enemies + light ----------

  buildEnemies() {
    this.enemies = this.physics.add.group();
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.enemies, (player, e) => {
      if (player.isDashing || e._lit) return;   // frozen in lantern light = harmless
      player.takeDamage(1, e.x, e.y);
      e.recoil(player.x, player.y);
    });
    this.physics.add.overlap(this.player.attackHitbox, this.enemies, (hb, e) => {
      if (!this.player.isAttacking) return;
      const charged = this.player.strikeCharged;
      if (e.takeHit(this.player.swingId, this.player.x, this.player.y, charged ? 3 : 1, charged)) {
        this.splat(e.x, e.y, 0x5ad678);
        this.maybeDropHeart(e.x, e.y, 0.3);
      }
    });
  }

  inLight(x, y, factor = 0.85) {
    return this.squad.some((a) => a.visible && a.lightR > 4 && Phaser.Math.Distance.Between(x, y, a.lanternX, a.lanternY + 12) < a.lightR * factor);
  }

  updateLightOnEnemies(time) {
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      if (this.inLight(e.x, e.y, 0.9)) {
        e.stunUntil = Math.max(e.stunUntil || 0, time + 160);
        if (e.body && e.body.moves !== false && !(e.body instanceof Phaser.Physics.Arcade.StaticBody)) e.body.setVelocity(0, 0);
        e.setTint(0xfff0b0);
        e._lit = true;
      } else if (e._lit) {
        e.clearTint();
        e._lit = false;
      }
    });
  }

  buildFog() {
    this.fog = this.add.renderTexture(0, 0, 640, 480).setOrigin(0).setScrollFactor(0).setDepth(50);
    this.hole = this.make.image({ key: 'light_hole', add: false }).setOrigin(0.5);
    this.exposureBar = this.add.graphics().setDepth(61);
    // warm lantern glow drawn over the fog so the light reads as firelight
    this.glow = this.add.graphics().setDepth(51).setBlendMode(Phaser.BlendModes.ADD);
  }

  drawFog() {
    const cam = this.cameras.main;
    this.fog.clear();
    this.fog.fill(A4_FOG_COLOR, this.fogAlpha);
    const punch = (wx, wy, r) => {
      if (r <= 1) return;
      this.hole.setScale(r / 96).setPosition(wx - cam.scrollX, wy - cam.scrollY);
      this.fog.erase(this.hole);
    };
    this.squad.forEach((a) => { if (a.visible) punch(a.lanternX, a.lanternY + 12, a.lightR * 1.15); });
    punch(this.player.x, this.player.y, 34);   // Gob can always see himself
    this.glow.clear();
    this.squad.forEach((a) => {
      if (!a.visible || a.lightR < 4) return;
      const flick = 1 + Math.sin(this.time.now / 90 + a.x) * 0.03;
      this.glow.fillStyle(0xffb347, 0.07).fillCircle(a.lanternX, a.lanternY + 12, a.lightR * 0.95 * flick);
      this.glow.fillStyle(0xffdc78, 0.08).fillCircle(a.lanternX, a.lanternY + 12, a.lightR * 0.55 * flick);
      this.glow.fillStyle(0xfff4c0, 0.35).fillCircle(a.lanternX, a.lanternY, 5 * flick);
    });
  }

  updateExposure(delta) {
    const p = this.player;
    this.exposureBar.clear();
    const active = this.stage >= 0 && !this.alone && !this.busy && !p.frozen && !p.isDead && !this.dialogue.open;
    if (!active) { this.exposure = Math.max(0, this.exposure - delta / 600); return; }
    if (this.inLight(p.x, p.y)) {
      this.exposure = Math.max(0, this.exposure - delta / 500);
    } else {
      this.exposure += delta / 2300;
      if (!this.warnedFog) { this.warnedFog = true; this.think('Fog BURN. Back to light!', 3500); }
      if (this.exposure >= 1) {
        this.exposure = 0.35;
        p.takeDamage(1);
        this.floatText(p.x, p.y - 26, 'the fog burns', '#5ad678');
      }
    }
    if (this.exposure > 0.02) {
      this.exposureBar.fillStyle(0x0d0617, 0.8).fillRect(p.x - 14, p.y - 26, 28, 4);
      this.exposureBar.fillStyle(0x5ad678, 1).fillRect(p.x - 13, p.y - 25, 26 * Math.min(1, this.exposure), 2);
    }
  }

  update(time, delta) {
    if (!this.player.isDead) this.player.update();
    this.updateLightOnEnemies(time);
    this.enemies.getChildren().forEach((e) => e.update(time, this.player));
    if (this.stage < 0 && !this.busy && this.player.y < A4_RING_ROW * TILE) this.ringScene();
    this.updateSquad(time, delta);
    this.updateExposure(delta);
    this.drawFog();
    this.updateHud();
  }
}
