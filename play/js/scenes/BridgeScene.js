// AREA 3 — THE BRIDGE. Per the Lore Book: townsfolk trying to cross out of
// the city are trapped mid-bridge while corrupted things climb up out of the
// river. Gob holds the line for them for nothing in return (his turning
// point); they mention the Holders; Solgorath roars; then Rugg is waiting in
// the toll plaza. Rugg names the dragon, his own eyes turn green, Gob makes
// a mental note, and the mini-boss fight starts. Reward: a heart container.
//
// Layout, south (entry) to north (exit):
//   South end (rows 36-44)      — a couple of river slimes to warm up
//   Hold the line (rows 17-35)  — 3 waves of rats + slimes from broken railings; protect the crowd
//   Toll gate (row 16)          — jammed shut until the line is held
//   Toll plaza (rows 5-15)      — the Rugg fight
//   North exit (row 4)          — on to the Tower District (Area 4)

const A3_COLS = 20;
const A3_ROWS = 46;
const A3_SKY_ROWS = 4;
const A3_GATE_ROW = 16;
const A3_LINE_TRIGGER_ROW = 27;
const A3_CROWD = { x: 10 * TILE, y: 18 * TILE + 24 };
const A3_GAP_ROWS = [19, 24, 29];
const A3_WAVES = [
  { list: ['slime', 'rat', 'slime', 'rat'], every: 1500 },
  { list: ['rat', 'rat', 'slime', 'rat', 'slime', 'rat'], every: 1300 },
  { list: ['rat', 'slime', 'rat', 'rat', 'slime', 'rat', 'slime', 'rat'], every: 1150 },
];
const A3_CROWD_HP = 12;

class BridgeScene extends AreaScene {
  constructor() {
    super('BridgeScene');
  }

  create() {
    this.initArea();
    // Phaser reuses this object on scene.restart(), so wipe run-time state
    // left over from a failed attempt (otherwise an emptied wave queue from
    // the last try reads as "line already held").
    this.waveQueue = undefined;
    this.waveIndex = 0;
    this.waveGap = false;
    this.crowdHp = A3_CROWD_HP;
    this.crowdBar = null;
    this.bossBar = null;
    this.arenaSeal = null;
    this.activeRug = null;
    this.registry.set('hasSword', true);
    this.registry.set('hasDash', true); // you can't arrive here without both
    this.flags = {
      lineStarted: false,
      lineHeld: !!this.registry.get('a3LineHeld'),
      ruggIntroSeen: !!this.registry.get('a3RuggIntroSeen'),
      ruggBeaten: !!this.registry.get('a3RuggBeaten'),
      fightStarted: false,
      lineFailed: false,
      atLine: !!this.registry.get('a3AtLine'),   // checkpoint: died during the siege
    };

    const W = A3_COLS * TILE;
    const H = A3_ROWS * TILE;
    this.drawSkyline(W, A3_SKY_ROWS, 0.7, 'skyline_a3');
    this.buildMap();
    this.physics.world.setBounds(0, A3_SKY_ROWS * TILE, W, H - A3_SKY_ROWS * TILE);
    this.cameras.main.setBounds(0, 0, W, H);

    let startY = 43 * TILE + 8;
    if (this.flags.atLine) startY = (A3_LINE_TRIGGER_ROW + 2) * TILE;
    if (this.flags.lineHeld) startY = (A3_GATE_ROW + 4) * TILE;
    this.player = new Player(this, W / 2, startY);
    this.player.direction = 'up';
    this.physics.add.collider(this.player, this.layer);

    this.buildPickups();
    this.buildShots();
    this.buildEnemies();
    this.buildGates();
    this.buildCrowd();
    this.buildRugg();
    this.buildExit();

    let hint = { think: 'Screaming. Up ahead, on the bridge.' };
    if (this.flags.lineHeld && !this.flags.ruggBeaten) hint = { think: 'Rugg in the plaza. Waiting.' };
    if (this.flags.ruggBeaten) hint = { think: 'Tower closer.' };
    this.finishArea('AREA 3', 'THE BRIDGE', hint);
  }

  // ---------- world ----------

  buildMap() {
    const data = [];
    for (let y = 0; y < A3_ROWS; y++) {
      const row = [];
      const plaza = y >= 5 && y < A3_GATE_ROW;
      const x0 = plaza ? 3 : 5;      // first deck column
      const x1 = plaza ? 16 : 14;    // last deck column
      for (let x = 0; x < A3_COLS; x++) {
        let t;
        if (y < A3_SKY_ROWS) t = -1;
        else if (y === A3_SKY_ROWS) t = (x >= 8 && x <= 11) ? T.DECK : T.BUILDING;   // north bank, exit gap
        else if (y === A3_ROWS - 1) t = T.BUILDING;                                    // south bank
        else if (y === A3_GATE_ROW) t = (x >= 8 && x <= 11) ? T.DECK : ((x >= 2 && x <= 17) ? T.RAIL : T.RIVER);
        else if (x >= x0 && x <= x1) t = T.DECK;
        else if (x === x0 - 1 || x === x1 + 1) t = T.RAIL;
        else t = T.RIVER;
        row.push(t);
      }
      data.push(row);
    }
    // broken railings: where things climb up out of the river
    this.spawnPoints = [];
    A3_GAP_ROWS.forEach((y) => {
      data[y][4] = T.GAP; data[y][15] = T.GAP;
      this.spawnPoints.push({ x: 5 * TILE + 16, y: y * TILE + 16 }, { x: 14 * TILE + 16, y: y * TILE + 16 });
    });
    // a few crates in the plaza to dodge around
    [[5, 8], [14, 8], [6, 13], [13, 13]].forEach(([x, y]) => { data[y][x] = T.CRATE; });
    this.buildTilemap(data, [2, 3, T.BUILDING, T.RAIL, T.RIVER, T.GAP, T.CRATE]);
  }

  buildGates() {
    // the jammed toll gate between the bridge and the plaza
    this.tollGate = null;
    if (!this.flags.lineHeld) {
      this.tollGate = this.physics.add.staticImage(10 * TILE, A3_GATE_ROW * TILE + 16, 'toll_gate').setDepth(6);
      this.physics.add.collider(this.player, this.tollGate);
    }
    // goo seals the north exit until Rugg is dealt with
    this.northSeal = null;
    if (!this.flags.ruggBeaten) {
      this.northSeal = this.physics.add.staticImage(10 * TILE, A3_SKY_ROWS * TILE + 16, 'goo_wall').setScale(2, 1).setDepth(6);
      this.northSeal.refreshBody();
      this.physics.add.collider(this.player, this.northSeal);
    }
  }

  // ---------- enemies ----------

  buildEnemies() {
    this.enemies = this.physics.add.group();
    if (!this.flags.lineHeld && !this.flags.atLine) {
      [[8, 37], [11, 34]].forEach(([cx, cy]) => this.enemies.add(new Slime(this, cx * TILE + 16, cy * TILE + 16)));
    }
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.enemies, (player, e) => {
      if (player.isDashing) return;
      if (e instanceof Rat && e.goal) {
        // siege rats are after the crowd: they bowl into Gob but don't bite him
        if (this.time.now > player.knockbackUntil) player.shove(e.x, e.y, 150);
      } else {
        player.takeDamage(1, e.x, e.y);
      }
      e.recoil(player.x, player.y);
    });
    this.physics.add.overlap(this.player.attackHitbox, this.enemies, (hb, e) => {
      if (!this.player.isAttacking) return;
      if (e.takeHit(this.player.swingId, this.player.x, this.player.y)) {
        this.splat(e.x, e.y, 0x5ad678);
        this.maybeDropHeart(e.x, e.y, e.dropsHeart ? 1 : (this.flags.lineStarted && !this.flags.lineHeld ? 0.3 : 0.2));
      }
    });
  }

  spawnEnemy(kind) {
    const far = this.spawnPoints.filter((p) => Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y) > 70);
    const p = Phaser.Utils.Array.GetRandom(far.length ? far : this.spawnPoints);
    const e = kind === 'rat' ? new Rat(this, p.x, p.y) : new Slime(this, p.x, p.y);
    if (kind === 'slime') {
      // river slimes: smaller, one hit, so the siege is about protecting the crowd
      e.hp = 1;
      e.setTint(0x9fd8ff);
    }
    e.goal = A3_CROWD;
    this.enemies.add(e);
    e.emerge();
    this.splat(p.x + (p.x < 320 ? -20 : 20), p.y, 0x5ad678);
    return e;
  }

  // ---------- hold the line ----------

  buildCrowd() {
    this.crowd = [];
    if (this.flags.lineHeld) return;
    const spots = [[-56, -6], [-20, -12], [16, -8], [52, -4], [-38, 14], [0, 16], [36, 12]];
    spots.forEach(([dx, dy], i) => {
      const f = this.add.sprite(A3_CROWD.x + dx, A3_CROWD.y + dy, 'townsfolk', (i % 3) * 2).setDepth(8);
      f.anims.play(`folk_${i % 3}`);
      f.anims.setProgress(Math.random());
      this.crowd.push(f);
    });
    this.crowdLeader = this.crowd[1];
    this.crowdZone = this.add.zone(A3_CROWD.x, A3_CROWD.y + 2, 150, 46);
    this.physics.add.existing(this.crowdZone, true);
    this.physics.add.collider(this.player, this.crowdZone);
    // NB: argument order matters: Phaser hands the callback (zone, enemy) here
    this.physics.add.overlap(this.crowdZone, this.enemies, (zone, e) => this.crowdBitten(e));
  }

  startLine() {
    this.flags.lineStarted = true;
    this.registry.set('a3AtLine', true);
    // any warm-up slimes Gob walked past join the siege (so waves can clear)
    this.enemies.getChildren().forEach((e) => { e.goal = A3_CROWD; });
    this.playDialogue([
      { who: 'Townsperson', text: "Help! They're crawling up out of the river! We were trying to get OUT of the city and now we're stuck!" },
      { who: 'Gob', text: 'Gob hold line.' },
      { who: null, text: 'HOLD THE LINE!\nKeep the creatures off the crowd.' },
    ], () => {
      this.crowdHp = A3_CROWD_HP;
      this.crowdBar = this.makeBar('THE CROWD', 0x4de1ff);
      this.setHint('');
      this.startWave(0);
    });
  }

  startWave(i) {
    this.waveIndex = i;
    this.waveQueue = A3_WAVES[i].list.slice();
    this.waveEvery = A3_WAVES[i].every;
    this.nextSpawnAt = this.time.now + 1200;
    const t = this.add.text(320, 200, `WAVE ${i + 1} / ${A3_WAVES.length}`, {
      fontFamily: 'monospace', fontSize: '20px', color: '#5ad678',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setShadow(0, 0, '#5ad678', 8, true, true);
    this.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 500, onComplete: () => t.destroy() });
  }

  crowdBitten(e) {
    if (!e.active || e === this.crowdZone || this.flags.lineHeld || this.flags.lineFailed) return;
    this.splat(e.x, e.y, 0xff6688);
    e.destroy();
    this.crowdHp -= 1;
    this.crowdBar.set(this.crowdHp / A3_CROWD_HP);
    this.cameras.main.shake(80, 0.004);
    const who = Phaser.Utils.Array.GetRandom(this.crowd);
    this.bark(who, [Phaser.Utils.Array.GetRandom(['AAAH!', 'It bit me!', 'Get it off!', 'Help!'])], '#ff6688', 900);
    this.crowd.forEach((f) => this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-3, 3), duration: 50, yoyo: true, repeat: 2 }));
    if (this.crowdHp <= 0) this.lineFailed();
  }

  updateLine(time) {
    if (!this.flags.lineStarted || this.flags.lineHeld || this.flags.lineFailed || this.waveQueue === undefined) return;
    if (this.waveQueue.length && time >= this.nextSpawnAt && this.enemies.countActive(true) < 7) {
      this.spawnEnemy(this.waveQueue.shift());
      this.nextSpawnAt = time + this.waveEvery;
    }
    if (!this.waveQueue.length && this.enemies.countActive(true) === 0 && !this.waveGap) {
      if (this.waveIndex + 1 < A3_WAVES.length) {
        this.waveGap = true;
        this.time.delayedCall(1800, () => { this.waveGap = false; this.startWave(this.waveIndex + 1); });
      } else {
        this.lineHeld();
      }
    }
  }

  lineFailed() {
    this.flags.lineFailed = true;
    this.enemies.clear(true, true);
    this.player.frozen = true;
    this.playDialogue([
      { who: null, text: 'The crowd breaks and scatters into the dark...' },
      { who: 'Gob', text: '...Again. Gob hold line better.' },
    ], () => {
      this.registry.set('hp', this.registry.get('maxHp'));
      this.scene.restart();
    });
  }

  lineHeld() {
    this.flags.lineHeld = true;
    this.registry.set('a3LineHeld', true);
    if (this.crowdBar) this.crowdBar.destroy();
    this.playDialogue([
      { who: 'Townsperson', text: 'You... you held them off. All of them. Who ARE you?' },
      { who: 'Gob', text: 'Gob.' },
      { who: 'Townsperson', text: "People whisper about the Holders, you know. The ones who still believe in truth and light. They'd want to hear about you." },
      { who: 'Townsperson', text: 'Come on, everyone! Off the bridge while we can!' },
    ], () => {
      this.crowd.forEach((f, i) => this.tweens.add({
        targets: f, y: 47 * TILE, duration: 2600 + i * 120, ease: 'Quad.In', onComplete: () => f.destroy(),
      }));
      if (this.crowdZone) this.crowdZone.destroy();
      this.time.delayedCall(1400, () => this.roar());
    });
  }

  roar() {
    this.player.frozen = true;
    this.cameras.main.shake(1300, 0.014);
    this.cameras.main.flash(300, 90, 214, 120);
    this.dragonShadow.setPosition(230, 70).setAlpha(0);
    this.tweens.add({
      targets: this.dragonShadow, alpha: 0.95, x: 400, duration: 2000, ease: 'Sine.InOut',
      onComplete: () => this.tweens.add({ targets: this.dragonShadow, alpha: 0, duration: 900 }),
    });
    this.time.delayedCall(1500, () => {
      this.playDialogue([
        { who: null, text: 'A roar rolls down from the S tower. The whole bridge shudders.' },
      ], () => this.openGate());
    });
  }

  openGate() {
    if (this.tollGate) {
      const g = this.tollGate;
      g.body.enable = false;
      this.tweens.add({ targets: g, y: g.y - 30, alpha: 0, duration: 700, onComplete: () => g.destroy() });
      this.tollGate = null;
    }
    this.cameras.main.shake(250, 0.008);
    this.think('Gate open. Someone waiting...');
  }

  // ---------- Rugg ----------

  buildRugg() {
    this.rugg = null;
    if (this.flags.ruggBeaten) return;
    this.rugg = new RuggBoss(this, 10 * TILE, 9 * TILE);
    this.rugg.setFlipX(false);
    if (!this.flags.ruggIntroSeen) {
      this.rugg.anims.play('rugg_idle');   // shades on until the reveal
    }
    this.physics.add.collider(this.rugg, this.layer);
    this.physics.add.overlap(this.player.attackHitbox, this.rugg, () => {
      if (!this.player.isAttacking) return;
      if (this.rugg.takeHit(this.player.swingId, this.player.x, this.player.y)) {
        this.splat(this.rugg.x, this.rugg.y, 0xe6be46);
        this.bossBar.set(this.rugg.hp / this.rugg.maxHp);
      }
    });
    this.physics.add.overlap(this.player, this.rugg, () => {
      if (!this.rugg.fighting || this.player.isDashing) return;
      if (this.rugg.charging) this.player.takeDamage(2, this.rugg.x, this.rugg.y);   // charge: 2 hearts
      else if (this.time.now > this.player.knockbackUntil) this.player.shove(this.rugg.x, this.rugg.y, 180);
    });
    this.rugg.on('phase2', () => {
      this.bark(this.rugg, ['Okay. NOW it\'s personal!'], '#ffe08a', 1500);
      for (let i = 0; i < 2; i++) {
        const r = new Rat(this, this.rugg.x + (i ? 40 : -40), this.rugg.y + 20);
        r.dropsHeart = true;
        this.enemies.add(r);
        r.emerge();
      }
    });
    this.rugg.on('defeated', () => this.ruggDefeated());
  }

  ruggScene() {
    this.flags.fightStarted = true;
    // seal the plaza behind Gob
    this.arenaSeal = this.physics.add.staticImage(10 * TILE, A3_GATE_ROW * TILE + 16, 'goo_wall').setScale(2, 1).setDepth(6);
    this.arenaSeal.refreshBody();
    this.physics.add.collider(this.player, this.arenaSeal);
    this.physics.add.collider(this.rugg, this.arenaSeal);
    this.physics.add.collider(this.enemies, this.arenaSeal);
    if (this.northSeal) this.physics.add.collider(this.rugg, this.northSeal);
    this.cameras.main.shake(150, 0.006);

    const r = this.rugg;
    const eyesOn = () => {
      r.anims.play('rugg_eyes');
      this.cameras.main.flash(220, 90, 214, 120);
      const glow = this.add.circle(r.x, r.y - 10, 4, 0x96ffaa, 0.9).setDepth(20);
      this.tweens.add({ targets: glow, radius: 26, alpha: 0, duration: 600, onUpdate: () => glow.setRadius(glow.radius), onComplete: () => glow.destroy() });
    };
    const lines = this.flags.ruggIntroSeen
      ? [
        { who: 'Rugg', text: 'Back for more, kid? No refunds. Business is business.' },
      ]
      : [
        { who: 'Rugg', text: 'Well, well. The kid with the legs. Saved the whole bridge, huh? Bad for business. Scared people buy coins.' },
        { who: 'Gob', text: 'Rugg coin fake. Dragon not care about coin.' },
        { who: 'Rugg', text: 'Fake? Kid, they\'re the realest thing in this town. ...You folks still calling it the "wen dragon"?' },
        { who: 'Gob', text: '...' },
        { who: 'Rugg', text: "Solgorath. That's its name. The one that eats everything worth anything. Heard it say so myself." },
        { who: 'Gob', text: 'Heard it?' },
        { who: 'Rugg', text: 'Figure of speech. Mostly.' },
        { who: null, text: "Rugg slides his shades down. His eyes are glowing green, the same green as Gob's.", onShow: eyesOn },
        { who: 'Rugg', text: 'Nothing personal, kid. Business is business.' },
        { note: true, text: 'Rugg eyes. Same green as Gob eyes. Gob remember.' },
        { who: null, text: 'FIGHT: RUGG' },
      ];
    this.playDialogue(lines, () => {
      this.registry.set('a3RuggIntroSeen', true);
      if (this.flags.ruggIntroSeen) r.anims.play('rugg_eyes');
      this.bossBar = this.makeBar('RUGG', 0xe6be46);
      this.think('Rugg tricky. Watch coins. Watch rug.');
      r.startFight();
    });
  }

  ruggDefeated() {
    this.shots.clear(true, true);
    this.enemies.clear(true, true);
    this.player.frozen = true;
    if (this.bossBar) this.bossBar.destroy();
    const r = this.rugg;
    r.setTint(0xaaaaaa);
    this.time.delayedCall(500, () => {
      this.playDialogue([
        { who: 'Rugg', text: 'Okay, okay! Uncle! UNCLE!' },
        { who: 'Rugg', text: "You'll see, kid. Everybody's got a price. Even you. ESPECIALLY you." },
      ], () => {
        // smoke bomb exit: he gets away (for now)
        for (let i = 0; i < 8; i++) this.splat(r.x + Phaser.Math.Between(-24, 24), r.y + Phaser.Math.Between(-20, 20), 0x5ad678);
        this.cameras.main.flash(200, 90, 214, 120);
        const hx = r.x; const hy = r.y;
        r.destroy();
        this.rugg = null;
        this.flags.ruggBeaten = true;
        this.registry.set('a3RuggBeaten', true);
        this.dropHeartContainer(hx, hy);
      });
    });
  }

  dropHeartContainer(x, y) {
    const hc = this.physics.add.staticImage(x, y, 'heart_container').setDepth(8);
    this.tweens.add({ targets: hc, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    this.think('Rugg drop something...');
    this.physics.add.overlap(this.player, hc, () => {
      if (!hc.active) return;
      hc.destroy();
      const max = this.registry.get('maxHp') + 1;
      this.registry.set('maxHp', max);
      this.player.maxHp = max;
      this.player.setHp(max);
      this.refreshHeartsHud();
      this.playDialogue([
        { who: null, text: 'Gob found a HEART CONTAINER!\nMax hearts +1.', onShow: () => this.cameras.main.flash(250, 255, 102, 136) },
      ], () => {
        if (this.northSeal) {
          const s = this.northSeal;
          s.body.enable = false;
          this.tweens.add({ targets: s, alpha: 0, duration: 500, onComplete: () => s.destroy() });
          this.northSeal = null;
        }
        this.think('Tower closer.');
      });
    });
  }

  buildExit() {
    const zone = this.add.zone(10 * TILE, A3_SKY_ROWS * TILE + 8, 4 * TILE, 12);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.player.isDead || !this.flags.ruggBeaten || this.northSeal) return;
      GameState.goTo(this, 'TowerDistrictScene');
    });
  }

  update(time) {
    if (!this.player.isDead) this.player.update();
    this.enemies.getChildren().forEach((e) => e.update(time, this.player));
    if (this.rugg) this.rugg.update(time, this.player, this);
    if (!this.flags.lineStarted && !this.flags.lineHeld && this.player.y < A3_LINE_TRIGGER_ROW * TILE) this.startLine();
    this.updateLine(time);
    if (this.rugg && !this.flags.fightStarted && this.flags.lineHeld && !this.tollGate && this.player.y < (A3_GATE_ROW - 1) * TILE) this.ruggScene();
    this.updateHud();
  }
}
