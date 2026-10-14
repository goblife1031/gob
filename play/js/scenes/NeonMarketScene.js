// AREA 2 — THE NEON MARKET. Per the Lore Book: dead billboards, corrupted
// vending machines and drones, the Watch hunting Gob as a monster, Rugg
// selling "dragon-proof" coins, Gob learning to DASH, and Solgorath's
// shadow passing overhead.
//
// Layout, south (entry) to north (exit):
//   Market street (rows 32-42) — fight drones + vending machines
//   Dash lesson (row 31)       — a billboard tears loose; Gob dodges: DASH learned
//   Sparking cables (28-29)    — must dash across (dash = can't be hurt)
//   Rugg's stall (20-27)       — Rugg's passing remark about Gob's eyes, then his pitch
//   Watch plaza (10-19)        — sneak past two lantern-carrying guards
//   North approach (5-9)       — exit toward the Bridge (Area 3)

const A2_COLS = 20;
const A2_ROWS = 44;
const A2_SKY_ROWS = 4;
const A2_DASH_ROW = 31;
const A2_CABLE_ROWS = [28, 29];
const A2_CHECKPOINT = { x: 10 * TILE, y: 21 * TILE + 8 };
const A2_GUARD_ROWS = [12, 16];

class NeonMarketScene extends AreaScene {
  constructor() {
    super('NeonMarketScene');
  }

  create() {
    this.initArea();
    this.registry.set('hasSword', true); // you can't arrive here without it
    this.flags = {
      dashLearned: !!this.registry.get('hasDash'), cablesCrossed: false, ruggBarked: false,
      talkedToRugg: false, shadowPassed: false, inPlaza: false, plazaCleared: false, catching: false,
    };
    this.timesCaught = 0;

    const W = A2_COLS * TILE;
    const H = A2_ROWS * TILE;
    this.drawSkyline(W, A2_SKY_ROWS, 0.4, 'skyline_a2');
    this.buildMap();
    this.decorateCables();
    this.physics.world.setBounds(0, A2_SKY_ROWS * TILE, W, H - A2_SKY_ROWS * TILE);
    this.cameras.main.setBounds(0, 0, W, H);

    this.player = new Player(this, W / 2, 41 * TILE + 8);
    this.player.direction = 'up';
    this.physics.add.collider(this.player, this.layer);

    this.buildPickups();
    this.buildShots();
    this.buildMachines();
    this.buildRugg();
    this.buildWatch();
    this.buildExit();

    this.finishArea('AREA 2', 'THE NEON MARKET',
      this.flags.dashLearned ? 'SHIFT to dash. Cross the sparking cables.' : { think: 'Machines gone bad. Smash, or sneak by.' });
  }

  // ---------- world ----------

  buildMap() {
    const data = [];
    for (let y = 0; y < A2_ROWS; y++) {
      const row = [];
      for (let x = 0; x < A2_COLS; x++) {
        let t;
        if (y < A2_SKY_ROWS) t = -1;
        else if (y === A2_SKY_ROWS) t = (x >= 8 && x <= 11) ? T.PLAZA : T.BUILDING;
        else if (y === A2_ROWS - 1) t = T.BUILDING;
        else if (x === 0 || x === A2_COLS - 1) t = (y % 5 === 0) ? T.NEON_BB : (y % 7 === 0 ? T.DEAD_BB : T.BUILDING);
        else t = T.PLAZA;
        row.push(t);
      }
      data.push(row);
    }
    const put = (cells, t) => cells.forEach(([x, y]) => { data[y][x] = t; });

    // market street: stall blocks along the sides
    put([[1, 33], [2, 33], [1, 34], [2, 34], [17, 36], [18, 36], [17, 37], [18, 37], [1, 39], [2, 39], [17, 41], [18, 41]], T.STALL);
    put([[6, 38], [13, 34]], T.CRATE);
    put([[2, 30], [17, 30], [3, 24], [16, 26]], T.DEAD_BB);
    // the sparking cables, wall to wall: the only way north is to dash across
    A2_CABLE_ROWS.forEach((y) => { for (let x = 1; x < A2_COLS - 1; x++) data[y][x] = T.CABLE; });
    // Rugg's corner
    put([[4, 22], [5, 22], [6, 26]], T.CRATE);
    // Watch plaza: crates for cover. Row 14 sits between both patrols and is
    // out of both lanterns' reach; row 18 is the waiting spot before crossing.
    put([[3, 14], [4, 14], [8, 14], [11, 14], [15, 14], [16, 14]], T.CRATE);
    put([[2, 18], [5, 18], [6, 18], [13, 18], [14, 18], [17, 18]], T.CRATE);
    put([[1, 10], [2, 10], [17, 10], [18, 10]], T.STALL);
    // north approach
    put([[1, 6], [2, 6], [17, 6], [18, 6]], T.NEON_BB);
    put([[5, 8], [14, 8]], T.CRATE);

    this.buildTilemap(data, [2, 3, T.BUILDING, T.POOL, T.CART, T.DEAD_BB, T.NEON_BB, T.CRATE, T.STALL]);
  }

  decorateCables() {
    // flickering sparks over the cable rows
    for (let i = 0; i < 14; i++) {
      const s = this.add.image(Phaser.Math.Between(40, 600), Phaser.Math.Between(A2_CABLE_ROWS[0] * TILE + 6, (A2_CABLE_ROWS[1] + 1) * TILE - 6), 'spark')
        .setDepth(3).setAlpha(0);
      this.tweens.add({
        targets: s, alpha: { from: 1, to: 0 }, duration: 140, delay: Phaser.Math.Between(0, 1200),
        repeat: -1, repeatDelay: Phaser.Math.Between(300, 1400),
      });
    }
  }

  // ---------- market street: drones + vending machines ----------

  buildMachines() {
    this.enemies = this.physics.add.group();
    this.machines = this.physics.add.staticGroup();
    [[4, 35], [15, 37], [15, 33]].forEach(([cx, cy]) => this.machines.add(new VendingMachine(this, cx * TILE + 16, cy * TILE)));
    [[9, 33], [5, 35], [12, 35]].forEach(([cx, cy]) => this.enemies.add(new Drone(this, cx * TILE + 16, cy * TILE + 16)));
    this.enemiesWakeAt = this.time.now + 1800; // let the area banner play before anything attacks

    this.physics.add.collider(this.player, this.machines);
    this.physics.add.overlap(this.player, this.enemies, (player, drone) => {
      if (player.isDashing) return;
      player.takeDamage(1, drone.x, drone.y);
      drone.recoil(player.x, player.y);
    });
    const onHit = (target) => {
      if (!this.player.isAttacking) return;
      if (target.takeHit(this.player.swingId, this.player.x, this.player.y)) {
        this.splat(target.x, target.y, 0x5ad678);
        this.splat(target.x + 8, target.y - 6, 0x7c3ac6);
        this.maybeDropHeart(target.x, target.y + 10, 0.45);
      }
    };
    this.physics.add.overlap(this.player.attackHitbox, this.enemies, (hb, d) => onHit(d));
    this.physics.add.overlap(this.player.attackHitbox, this.machines, (hb, m) => onHit(m));
  }

  // ---------- the dash lesson ----------

  dashLesson() {
    this.flags.dashLearned = true;
    this.player.frozen = true;
    const gx = this.player.x;
    const gy = this.player.y;
    // shadow grows where the billboard is about to land
    const shadow = this.add.ellipse(gx, gy - 6, 20, 8, 0x000000, 0.5).setDepth(2);
    this.tweens.add({ targets: shadow, width: 70, height: 26, duration: 700 });
    const sign = this.add.image(gx, gy - 260, 'billboard_debris').setDepth(30).setAngle(-20);
    this.floatText(gx, gy - 30, '!', '#ff6688');
    this.time.delayedCall(450, () => {
      // Gob's body moves before he does
      this.player.frozen = false;
      this.player.startDash(0, 1);
      this.player.frozen = true;
    });
    this.tweens.add({
      targets: sign, y: gy - 4, angle: 4, duration: 700, ease: 'Quad.In',
      onComplete: () => {
        shadow.destroy();
        this.cameras.main.shake(300, 0.012);
        for (let i = 0; i < 6; i++) this.splat(gx + Phaser.Math.Between(-30, 30), gy + Phaser.Math.Between(-10, 10), 0xb07ce6);
        sign.setDepth(5);
        const block = this.add.zone(gx, gy - 4, 58, 30);
        this.physics.add.existing(block, true);
        this.physics.add.collider(this.player, block);
        this.time.delayedCall(500, () => {
          this.playDialogue([
            { who: 'Gob', text: '...Gob fast.' },
            {
              who: null,
              text: 'Gob learned DASH!\nSHIFT to dash. Gob can\'t be hurt mid-dash.',
              onShow: () => { this.registry.set('hasDash', true); this.cameras.main.flash(250, 176, 124, 230); },
            },
          ], () => this.setHint('Dash across the sparking cables (SHIFT while moving).'));
        });
      },
    });
  }

  // Cables: walking in gets Gob zapped and thrown back; dashing goes through.
  updateCables() {
    const top = A2_CABLE_ROWS[0] * TILE + 4;
    const bottom = (A2_CABLE_ROWS[1] + 1) * TILE - 4;
    const p = this.player;
    if (p.y < top - 12 && !this.flags.cablesCrossed) {
      this.flags.cablesCrossed = true;
      this.think('Somebody yelling about coins...');
    }
    if (p.isDashing || p.isDead || p.y < top || p.y > bottom) return;
    // throw him back out the side he came in from
    const mid = (top + bottom) / 2;
    const cameFromSouth = p.y > mid;
    const srcY = cameFromSouth ? top - 40 : bottom + 40;   // hit "comes from" the far side
    if (p.invincible) {
      p.shove(p.x, srcY, 260);
    } else {
      p.takeDamage(1, p.x, srcY);
      this.floatText(p.x, p.y - 24, 'ZAP!', '#e6ff78');
      this.cameras.main.flash(80, 230, 255, 120);
    }
  }

  // ---------- Rugg ----------

  buildRugg() {
    const sx = 16 * TILE;
    const sy = 23 * TILE;
    this.add.image(sx, sy, 'rugg_stall').setDepth(5);
    const stallBody = this.add.zone(sx, sy + 8, 60, 44);
    this.physics.add.existing(stallBody, true);
    this.physics.add.collider(this.player, stallBody);

    this.rugg = this.add.sprite(sx - 46, sy + 10, 'rugg', 0).setDepth(9).setFlipX(true).setOrigin(0.5, NPC48_ORIGIN_Y);
    this.rugg.anims.play('rugg_idle');
    this.physics.add.existing(this.rugg, true);
    this.rugg.body.setSize(18, 14).setOffset(15, 34);
    this.physics.add.collider(this.player, this.rugg);

    this.addNpc(this.rugg, () => this.ruggLines(), () => {
      if (!this.flags.talkedToRugg) {
        this.flags.talkedToRugg = true;
        this.think('Watch ahead. Lanterns see green. Gob stay dark.');
      }
    });
  }

  // Brad's ask: Rugg remarks on Gob's eyes in passing, once Gob has the dash.
  updateRuggBark() {
    if (this.flags.ruggBarked || !this.flags.dashLearned || this.dialogue.open) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.rugg.x, this.rugg.y) > 170) return;
    this.flags.ruggBarked = true;
    this.bark(this.rugg, [
      'Whoa-ho! Look at the legs on this one!',
      'And those eyes, kid. That green is VERY in this season.',
      'Real... dragon-adjacent. Ha! Just saying.',
    ], '#ffe08a');
  }

  ruggLines() {
    if (this.flags.talkedToRugg) {
      return [{ who: 'Rugg', text: "No coin, no coin, kid. Come back when you're liquid. Rugg's always open. Mostly." }];
    }
    return [
      { who: 'Rugg', text: "Step right up! Rugg's Genuine Dragon-Proof Coins! Hold one and the wen dragon flies RIGHT past you. Guaranteed!*" },
      { who: 'Rugg', text: '*Guarantee not guaranteed.' },
      { who: 'Gob', text: 'Gob have no coin. Gob coin went to zero.' },
      { who: 'Rugg', text: "Zero, huh? Tough market. Tell you what: I'll remember your face. Hard to forget those eyes." },
      { who: 'Rugg', text: "Free tip, since you're broke: the Watch is all over the plaza up north. They see green, they swing first. Stay out of their lanterns." },
    ];
  }

  // ---------- the Watch ----------

  buildWatch() {
    this.guards = this.physics.add.group({ allowGravity: false, immovable: true });
    const g1 = new WatchGuard(this, 4 * TILE, A2_GUARD_ROWS[0] * TILE + 16, 2 * TILE, 17 * TILE, 1);
    const g2 = new WatchGuard(this, 15 * TILE, A2_GUARD_ROWS[1] * TILE + 16, 2 * TILE, 17 * TILE, -1);
    [g1, g2].forEach((g) => this.guards.add(g));
    this.physics.add.collider(this.player, this.guards);
    this.physics.add.overlap(this.player.attackHitbox, this.guards, (hb, guard) => {
      if (!this.player.isAttacking || this.flags.catching) return;
      this.floatText(guard.x, guard.y - 26, 'CLANG!', '#eee7f8');
      this.caught(guard, 'Swinging at the Watch? Oh, you are DONE.');
    });
  }

  updateWatch(time) {
    const p = this.player;
    if (!this.flags.inPlaza && p.y < 21 * TILE) {
      this.flags.inPlaza = true;
      this.think('Light find Gob. Crates make shadow. Wait... then go.');
      this.shadowPass();
    }
    if (!this.flags.plazaCleared && p.y < 10 * TILE) {
      this.flags.plazaCleared = true;
      this.think('Tower closer.');
    }
    this.guards.getChildren().forEach((g) => {
      g.update(time);
      if (!this.flags.catching && !p.isDead && !this.dialogue.open && g.canSee(p, this)) this.caught(g);
    });
  }

  caught(guard, line) {
    this.flags.catching = true;
    this.timesCaught += 1;
    guard.alerted = true;
    this.player.frozen = true;
    this.player.body.setVelocity(0, 0);
    this.guards.getChildren().forEach((g) => g.holdStill(2000));
    const lines = [
      'HALT! Another one crawled out of the gutters!',
      'Monster! Grab it!',
      'There it is again! Green eyes, can\'t miss it!',
    ];
    this.bark(guard, [line || lines[(this.timesCaught - 1) % lines.length]], '#ffdc78', 1300);
    this.time.delayedCall(1100, () => {
      this.cameras.main.fadeOut(300, 13, 6, 23);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.player.setPosition(A2_CHECKPOINT.x, A2_CHECKPOINT.y);
        this.player.direction = 'up';
        this.guards.getChildren().forEach((g) => { g.reset(); g.alerted = false; });
        this.cameras.main.fadeIn(300, 13, 6, 23);
        this.player.frozen = false;
        this.flags.catching = false;
        this.floatText(this.player.x, this.player.y - 26, 'Thrown back to the market.', '#b07ce6');
      });
    });
  }

  // Solgorath passes over the plaza. The guards freeze and look up: a window.
  shadowPass() {
    this.flags.shadowPassed = true;
    const cam = this.cameras.main;
    const dim = this.add.rectangle(320, 240, 640, 480, 0x020602, 0).setScrollFactor(0).setDepth(90);
    const shade = this.add.ellipse(-200, cam.scrollY + 200, 520, 220, 0x000000, 0.45).setDepth(89);
    this.tweens.add({ targets: dim, fillAlpha: 0.35, duration: 600, yoyo: true, hold: 1600 });
    this.tweens.add({ targets: shade, x: 860, duration: 2800, ease: 'Sine.InOut', onComplete: () => shade.destroy() });
    this.time.delayedCall(2900, () => dim.destroy());
    this.dragonShadow.setPosition(200, 70).setAlpha(0);
    this.tweens.add({
      targets: this.dragonShadow, alpha: 0.9, x: 440, duration: 2400, ease: 'Sine.InOut',
      onComplete: () => this.tweens.add({ targets: this.dragonShadow, alpha: 0, duration: 800 }),
    });
    cam.shake(1400, 0.004);
    this.guards.getChildren().forEach((g) => g.holdStill(3600));
    this.bark(this.guards.getChildren()[1], ['Eyes up... it\'s passing over. Nobody move.'], '#ffdc78', 2600);
  }

  buildExit() {
    const zone = this.add.zone(10 * TILE, A2_SKY_ROWS * TILE + 12, 4 * TILE, 20);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.player.isDead || this.flags.catching) return;
      GameState.goTo(this, 'BridgeScene');
    });
  }

  update(time) {
    if (!this.player.isDead) this.player.update();
    if (time > this.enemiesWakeAt) {
      this.enemies.getChildren().forEach((d) => d.update(time, this.player));
      this.machines.getChildren().forEach((m) => m.update(time, this.player, this));
    }
    if (!this.flags.dashLearned && this.player.y < A2_DASH_ROW * TILE + 16) this.dashLesson();
    this.updateCables();
    this.updateRuggBark();
    this.updateWatch(time);
    this.updateHud();
  }
}
