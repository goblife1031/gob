// AREA 5 (part 2) — THE ROOF: Solgorath. Per the Lore Book: the dragon is
// coiled around the top of the S tower, feeding on the neon S itself.
// "You are not like the pathetic beings screeching on the streets. What is
// your worth, creature?" "Gob worth nothing. Gob build himself."
//
// Three phases (each a checkpoint):
//   1 THE HEAD     breath sweeps (dash through / step out of the band) and claw
//                  slams that leave corruption pools; after each slam the head
//                  rests on the roof, eye open: hit the eye (charged = 3)
//   2 THE S FEEDS  green energy from the S sign heals Solgorath; break the
//                  three conduits (charged strikes) while it attacks
//   3 DESPERATE    faster, darker, adds drop onto the roof; crack the eye
// Then: the confession ("I consumed your little coin. Barely a morsel."),
// Gob's eyes turn red, the player HOLDS SPACE for the rage strike, "...Enough.",
// and the green flash -> EndingScene.

const R_COLS = 20;
const R_ROWS = 16;
const R_SKY_ROWS = 4;
const R_HEAD_UP = { x: 320, y: 78 };
const R_HEAD_REST = { x: 320, y: 280 };   // far enough down that the neck lies across the roof
const R_MAX_HP = 12;
const R_NECK_BASE = { x: 320, y: 44 };   // where the neck leaves the body
const R_NECK_SEGS = 9;
const R_CONDUITS = [[3 * TILE + 16, 8 * TILE], [16 * TILE + 16, 8 * TILE], [10 * TILE, 12 * TILE + 16]];

class RoofScene extends AreaScene {
  constructor() {
    super('RoofScene');
  }

  create() {
    this.initArea();
    ['hasSword', 'hasDash', 'hasCharge'].forEach((k) => this.registry.set(k, true));
    // reset run-time state (Phaser reuses this object on restart)
    this.phase = this.registry.get('a5Phase') || 1;
    this.bossHp = { 1: R_MAX_HP, 2: 6, 3: 8 }[this.phase];
    this.headState = 'up';
    this.nextAttackAt = 0;
    this.attackIndex = 0;
    this.fighting = false;
    this.ended = false;
    this.rage = null;
    this.pools = [];
    this.activeBand = null;
    this.activeSlam = null;
    this.lastEyeSwing = -1;
    this.regenAt = 0;
    this.restCount = 0;
    this.activeSweep = false;
    this.activeClaws = null;
    this.neckHits = 0;
    this.flinched = false;
    this.lastNeckSwing = -1;

    const W = R_COLS * TILE;
    const H = R_ROWS * TILE;
    this.cameras.main.setBackgroundColor('#06040c');
    this.drawSky();
    this.buildMap();
    this.physics.world.setBounds(0, (R_SKY_ROWS + 1) * TILE, W, H - (R_SKY_ROWS + 1) * TILE);
    this.cameras.main.setBounds(0, 0, W, H);

    this.player = new Player(this, W / 2, 14 * TILE);
    this.player.direction = 'up';
    this.physics.add.collider(this.player, this.layer);

    this.buildPickups();
    this.buildEnemies();
    this.buildHead();
    this.buildConduits();
    this.fx = this.add.graphics().setDepth(4);          // telegraphs, pools
    this.beamFx = this.add.graphics().setDepth(19);     // breath beams
    this.dark = this.add.rectangle(320, 240, 640, 480, 0x000000, 0).setScrollFactor(0).setDepth(90);
    if (this.phase === 3) this.dark.setFillStyle(0x000000, 0.28);

    this.finishArea('AREA 5', 'THE ROOF', '');
    this.time.delayedCall(900, () => this.intro());
  }

  // ---------- world ----------

  drawSky() {
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0x0b0514, 1).fillRect(0, 0, 640, R_SKY_ROWS * TILE + 32);
    g.fillStyle(0x5ad678, 0.12).fillRect(0, 0, 640, R_SKY_ROWS * TILE + 32);
    // Solgorath's body, rising behind the far edge of the roof (the roof
    // tiles draw over its lower half, so it reads as being behind the building)
    this.dragonBody = this.add.image(320, 62, 'solgorath_body').setDepth(-9);
    this.tweens.add({ targets: this.dragonBody, y: 66, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // the giant neon S, humming overhead
    this.sSign = this.add.text(320, 40, 'S', {
      fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '76px', color: '#4de1ff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(-8).setShadow(0, 0, '#5ad678', 18, true, true);
    this.tweens.add({ targets: this.sSign, alpha: 0.75, duration: 900, yoyo: true, repeat: -1 });
    this.energy = this.add.graphics().setDepth(5);   // above the roof tiles, below the head
  }

  buildMap() {
    const data = [];
    for (let y = 0; y < R_ROWS; y++) {
      const row = [];
      for (let x = 0; x < R_COLS; x++) {
        let t;
        if (y < R_SKY_ROWS) t = -1;
        else if (y === R_SKY_ROWS) t = T.LEDGE;
        else if (y === R_ROWS - 1) t = (x === 9 || x === 10) ? T.ROOF : T.TOWER;
        else if (x === 0 || x === R_COLS - 1) t = T.LEDGE;
        else t = T.ROOF;
        row.push(t);
      }
      data.push(row);
    }
    this.buildTilemap(data, [T.LEDGE, T.TOWER]);
  }

  buildHead() {
    // the neck: a chain of scaled segments from the body to the head, redrawn
    // every frame so it stretches over the roof when the head comes down
    this.neckSegs = [];
    for (let i = 0; i < R_NECK_SEGS; i++) this.neckSegs.push(this.add.image(320, 60, 'solgorath_neck').setDepth(17).setScale(1.25));
    this.head = this.add.sprite(R_HEAD_UP.x, R_HEAD_UP.y, 'solgorath', 0).setDepth(18);
    this.tweens.add({ targets: this.head, y: R_HEAD_UP.y + 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // blocks Gob while the head rests on the roof
    this.headBlock = this.add.zone(R_HEAD_REST.x, R_HEAD_REST.y + 4, 150, 104);
    this.physics.add.existing(this.headBlock, true);
    this.headBlock.body.enable = false;
    this.physics.add.collider(this.player, this.headBlock);
    // the face hit zone (only live while resting): the whole head, and wider
    // than the block above so Gob can land hits from the sides as well as the front
    this.eyeZone = this.add.zone(R_HEAD_REST.x, R_HEAD_REST.y + 4, 196, 140);
    this.physics.add.existing(this.eyeZone, true);
    this.eyeZone.body.enable = false;
    this.physics.add.overlap(this.player.attackHitbox, this.eyeZone, () => this.hitEye());
    // the stretch of neck lying on the roof behind the resting head: hittable
    // (three hits make the head flinch and stay down longer), harmless to touch
    const neckTop = (R_SKY_ROWS + 1) * TILE;
    const neckBottom = R_HEAD_REST.y - 40;
    this.neckZone = this.add.zone(R_HEAD_REST.x, (neckTop + neckBottom) / 2, 56, neckBottom - neckTop);
    this.physics.add.existing(this.neckZone, true);
    this.neckZone.body.enable = false;
    this.physics.add.overlap(this.player.attackHitbox, this.neckZone, () => this.hitNeck());
  }

  buildConduits() {
    this.conduits = [];
    if (this.phase > 2) return;
    R_CONDUITS.forEach(([x, y]) => {
      const c = this.physics.add.staticImage(x, y, 'conduit', 0).setDepth(6);
      c.body.setSize(24, 30).setOffset(4, 16);
      c.live = true;
      c.lastSwing = -1;
      this.physics.add.collider(this.player, c);
      this.physics.add.overlap(this.player.attackHitbox, c, () => this.hitConduit(c));
      this.conduits.push(c);
    });
  }

  buildEnemies() {
    this.enemies = this.physics.add.group();
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.player, this.enemies, (player, e) => {
      if (player.isDashing) return;
      player.takeDamage(1, e.x, e.y);
      e.recoil(player.x, player.y);
    });
    this.physics.add.overlap(this.player.attackHitbox, this.enemies, (hb, e) => {
      if (!this.player.isAttacking) return;
      const charged = this.player.strikeCharged;
      if (e.takeHit(this.player.swingId, this.player.x, this.player.y, charged ? 3 : 1, charged)) {
        this.splat(e.x, e.y, 0x5ad678);
        this.maybeDropHeart(e.x, e.y, 0.5);
      }
    });
  }

  // ---------- story ----------

  intro() {
    const seen = this.registry.get('a5IntroSeen');
    const lines = seen
      ? [{ who: 'Solgorath', text: 'Back again, creature? Then come.' }]
      : [
        { who: null, text: 'Wind. The giant neon S hums overhead, and ropes of green light run from the sign into the dragon coiled around the tower. It is feeding on the S itself.' },
        { who: 'Solgorath', text: 'So. The one who held the bridge.' },
        { who: 'Solgorath', text: 'You are not like the pathetic beings screeching on the streets. What is your worth, creature?' },
        { who: 'Gob', text: 'Gob worth nothing. Gob build himself.' },
        { who: null, text: 'FIGHT: SOLGORATH' },
      ];
    this.head.setFrame(1);
    this.playDialogue(lines, () => {
      this.registry.set('a5IntroSeen', true);
      this.bossBar = this.makeBar('SOLGORATH', 0x96ffaa, 440);   // bottom: the head lives at the top
      this.bossBar.set(this.bossHp / R_MAX_HP);
      this.fighting = true;
      this.nextAttackAt = this.time.now + 900;
      if (this.phase === 2) this.startPhase2(true);
      else this.think(this.phase === 3 ? 'Dragon hurting. Finish it.' : 'Big eye. Head come down... Gob hit eye.');
      this.head.setFrame(0);
    });
  }

  // ---------- attacks ----------

  updateBoss(time) {
    if (!this.fighting || this.ended || this.player.isDead || this.headState !== 'up' || this.dialogue.open) return;
    if (time < this.nextAttackAt) return;
    const seqs = { 1: ['breath', 'slam', 'breath', 'slam'], 2: ['breath', 'slam2', 'breath', 'sweep'], 3: ['slam', 'claw', 'breath', 'slam', 'claw', 'breath'] };
    const seq = seqs[this.phase];
    const move = seq[this.attackIndex % seq.length];
    this.attackIndex += 1;
    if (move === 'breath') this.breath();
    else if (move === 'slam') this.slam(true);
    else if (move === 'slam2') this.slam(false);
    else if (move === 'drop') this.dropAdds(2);
    else if (move === 'sweep') this.sweep();
    else if (move === 'claw') this.claws();
    const gap = { 1: 2300, 2: 2400, 3: 1900 }[this.phase];
    this.nextAttackAt = time + gap;
  }

  breath() {
    const warn = this.phase === 3 ? 700 : 900;
    const bandY = Phaser.Math.Clamp(this.player.y, 6 * TILE, 14 * TILE);
    this.activeBand = { y: bandY };   // exposed for tests / future helpers
    this.head.setFrame(3);
    let t = 0;
    const tele = this.time.addEvent({
      delay: 60, repeat: Math.floor(warn / 60), callback: () => {
        t += 1;
        this.beamFx.clear();
        this.beamFx.fillStyle(0x96ffaa, 0.08 + (t % 2) * 0.08).fillRect(16, bandY - 30, 608, 60);
        this.beamFx.lineStyle(2, 0x96ffaa, 0.8).strokeRect(16, bandY - 30, 608, 60);
      },
    });
    this.time.delayedCall(warn, () => {
      tele.remove();
      if (this.ended) { this.beamFx.clear(); return; }
      this.beamFx.clear();
      this.beamFx.fillStyle(0xd8ff6a, 0.6).fillRect(16, bandY - 30, 608, 60);
      this.beamFx.fillStyle(0xffffff, 0.5).fillRect(16, bandY - 10, 608, 20);
      this.cameras.main.shake(300, 0.008);
      const p = this.player;
      if (!p.isDashing && !this.dialogue.open && Math.abs(p.y - bandY) < 32) p.takeDamage(3, p.x, bandY - 40);   // breath: 3 hearts
      this.time.delayedCall(420, () => { this.beamFx.clear(); this.activeBand = null; if (!this.ended) this.head.setFrame(0); });
    });
  }

  slam(thenRest) {
    const warn = this.phase === 3 ? 650 : 850;
    const sx = this.player.x; const sy = this.player.y;
    this.activeSlam = { x: sx, y: sy, r: 46 };
    const ring = this.add.circle(sx, sy, 46, 0x000000, 0.25).setStrokeStyle(2, 0xff6688).setDepth(5);
    this.tweens.add({ targets: ring, alpha: 0.6, duration: 120, yoyo: true, repeat: Math.floor(warn / 240) });
    this.time.delayedCall(warn, () => {
      ring.destroy();
      this.activeSlam = null;
      if (this.ended) return;
      this.cameras.main.shake(220, 0.012);
      const impact = this.add.ellipse(sx, sy, 100, 70, 0x1c4a2a, 0.9).setDepth(5);
      this.tweens.add({ targets: impact, alpha: 0, duration: 500, onComplete: () => impact.destroy() });
      const p = this.player;
      if (!p.isDashing && !this.dialogue.open && Phaser.Math.Distance.Between(p.x, p.y, sx, sy) < 46) p.takeDamage(3, sx, sy);   // slam: 3 hearts
      this.pools.push({ x: sx, y: sy, r: 34, until: this.time.now + 2800 });
      if (thenRest && this.phase !== 2) this.time.delayedCall(350, () => this.rest());
    });
  }

  dropAdds(n) {
    if (this.enemies.countActive(true) >= 2) return;   // phase 3 only; keep it about the dragon
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Between(3, 16) * TILE; const y = Phaser.Math.Between(7, 13) * TILE;
      const kind = Phaser.Utils.Array.GetRandom(['rat', 'slime']);
      const mark = this.add.circle(x, y, 14, 0x5ad678, 0.35).setDepth(5);
      this.time.delayedCall(700, () => {
        mark.destroy();
        if (this.ended) return;
        const e = kind === 'garg' ? new Gargoyle(this, x, y, false) : (kind === 'rat' ? new Rat(this, x, y) : new Slime(this, x, y));
        if (e.emerge) e.emerge();
        this.enemies.add(e);
        this.splat(x, y, 0x5ad678);
      });
    }
  }

  // the head comes down to rest on the roof: the eye is open and hittable
  rest() {
    if (this.ended) return;
    this.headState = 'moving';
    this.tweens.killTweensOf(this.head);
    this.tweens.add({
      targets: this.head, x: R_HEAD_REST.x, y: R_HEAD_REST.y, duration: 450, ease: 'Quad.In',
      onComplete: () => {
        if (this.ended) return;
        this.headState = 'resting';
        this.head.setFrame(1);
        this.cameras.main.shake(180, 0.008);
        this.headBlock.body.enable = true;
        this.eyeZone.body.enable = true;
        this.neckZone.body.enable = true;
        this.neckHits = 0;
        this.flinched = false;
        this.pushPlayerOutOfHead();
        if (this.phase === 3) { this.restCount = (this.restCount || 0) + 1; if (this.restCount % 2 === 0) this.dropAdds(1); }
        const dur = this.phase === 3 ? 2300 : 2600;
        this.restTimer = this.time.delayedCall(dur, () => this.rise());
      },
    });
  }

  pushPlayerOutOfHead() {
    const p = this.player;
    const b = this.headBlock;
    if (Math.abs(p.x - b.x) < 80 && Math.abs(p.y - b.y) < 70) {
      p.body.reset(p.x, b.y + 84);
    }
  }

  rise() {
    if (this.ended) return;
    this.headBlock.body.enable = false;
    this.eyeZone.body.enable = false;
    this.neckZone.body.enable = false;
    this.headState = 'moving';
    this.head.setFrame(0);
    this.tweens.add({
      targets: this.head, x: R_HEAD_UP.x, y: R_HEAD_UP.y, duration: 500, ease: 'Quad.Out',
      onComplete: () => {
        if (this.ended) return;
        this.headState = 'up';
        this.nextAttackAt = this.time.now + 700;
        this.tweens.add({ targets: this.head, y: R_HEAD_UP.y + 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      },
    });
  }

  // ---------- the neck ----------

  setNeckTint(color) {
    this.neckSegs.forEach((s) => (color ? s.setTint(color) : s.clearTint()));
  }

  hitNeck() {
    const p = this.player;
    if (!p.isAttacking || this.headState !== 'resting' || this.ended || p.swingId === this.lastNeckSwing) return;
    this.lastNeckSwing = p.swingId;
    this.neckHits = (this.neckHits || 0) + (p.strikeCharged ? 2 : 1);
    this.setNeckTint(0xffffff);
    this.time.delayedCall(100, () => this.setNeckTint(null));
    this.splat(p.attackHitbox.x, p.attackHitbox.y, 0x96ffaa);
    if (this.neckHits >= 3 && !this.flinched) {
      // the head flinches: eyes squeeze shut, and it stays down longer
      this.flinched = true;
      this.floatText(this.head.x, this.head.y - 60, 'FLINCH!', '#d8ff6a');
      this.cameras.main.shake(160, 0.008);
      this.head.setFrame(0);
      this.time.delayedCall(350, () => { if (this.headState === 'resting') this.head.setFrame(1); });
      if (this.restTimer) {
        const left = this.restTimer.getRemaining();
        this.restTimer.remove();
        this.restTimer = this.time.delayedCall(left + 1500, () => this.rise());
      }
    }
  }

  // Phase 2: the head stays up and the neck swings across the roof like a
  // scythe at Gob's height. 2 hearts. Dash through it, or get below the head.
  sweep() {
    if (this.ended) return;
    this.headState = 'sweeping';
    this.tweens.killTweensOf(this.head);
    const fromLeft = this.player.x > 320;
    const sx = fromLeft ? 60 : 580; const ex = fromLeft ? 580 : 60;
    const y = Phaser.Math.Clamp(this.player.y, 230, 13 * TILE);
    this.head.setFrame(1);
    // wind-up: the head pulls back to one side and the neck flashes red
    this.tweens.add({ targets: this.head, x: sx, y, duration: 600, ease: 'Sine.Out' });
    const flash = this.time.addEvent({ delay: 110, repeat: 7, callback: (ev) => this.setNeckTint(flash.repeatCount % 2 ? 0xff6688 : null) });
    this.time.delayedCall(1300, () => {
      flash.remove(); this.setNeckTint(0xff9aa8);
      if (this.ended) return;
      this.cameras.main.shake(250, 0.006);
      this.activeSweep = true;
      this.tweens.add({
        targets: this.head, x: ex, duration: 650, ease: 'Sine.InOut',
        onComplete: () => {
          this.activeSweep = false; this.setNeckTint(null);
          if (this.ended) return;
          this.tweens.add({
            targets: this.head, x: R_HEAD_UP.x, y: R_HEAD_UP.y, duration: 500, ease: 'Quad.Out',
            onComplete: () => {
              if (this.ended) return;
              this.headState = 'up';
              this.nextAttackAt = this.time.now + 700;
              this.tweens.add({ targets: this.head, y: R_HEAD_UP.y + 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
            },
          });
        },
      });
    });
  }

  // true if Gob is touching the neck line (body to head) or the head itself
  touchingNeck() {
    const p = this.player;
    const ax = R_NECK_BASE.x; const ay = R_NECK_BASE.y; const bx = this.head.x; const by = this.head.y - 34;
    const dx = bx - ax; const dy = by - ay; const len2 = dx * dx + dy * dy || 1;
    const t = Phaser.Math.Clamp(((p.x - ax) * dx + (p.y - ay) * dy) / len2, 0, 1);
    const d = Phaser.Math.Distance.Between(p.x, p.y, ax + dx * t, ay + dy * t);
    return d < 30 || Phaser.Math.Distance.Between(p.x, p.y, this.head.x, this.head.y) < 62;
  }

  // Phase 3: claws rake over the far roof edge. Two of three columns of the
  // top rows flash red, then the claws come down. 2 hearts.
  claws() {
    if (this.ended) return;
    const cols = [[16, 218], [218, 422], [422, 624]];
    const safe = Phaser.Math.Between(0, 2);
    const top = (R_SKY_ROWS + 1) * TILE; const bottom = 9 * TILE;
    const zones = cols.filter((c, i) => i !== safe);
    const warn = 750;
    const marks = zones.map(([x0, x1]) => this.add.rectangle((x0 + x1) / 2, (top + bottom) / 2, x1 - x0, bottom - top, 0xff3355, 0.18).setStrokeStyle(2, 0xff6688).setDepth(4));
    this.tweens.add({ targets: marks, alpha: 0.5, duration: 120, yoyo: true, repeat: Math.floor(warn / 240) });
    this.activeClaws = zones;   // exposed for tests / future helpers
    this.time.delayedCall(warn, () => {
      marks.forEach((m) => m.destroy());
      if (this.ended) { this.activeClaws = null; return; }
      this.cameras.main.shake(260, 0.012);
      zones.forEach(([x0, x1]) => {
        const cx = (x0 + x1) / 2;
        const claw = this.add.image(cx, top - 120, 'solgorath_claw').setDepth(16).setScale(1.3);
        this.tweens.add({ targets: claw, y: bottom - 70, duration: 140, ease: 'Quad.In', onComplete: () => {
          for (let i = 0; i < 4; i++) this.splat(cx + Phaser.Math.Between(-60, 60), bottom - Phaser.Math.Between(0, 40), 0x5ad678);
          this.tweens.add({ targets: claw, y: top - 140, alpha: 0, delay: 380, duration: 320, onComplete: () => claw.destroy() });
        } });
      });
      const p = this.player;
      const hit = zones.some(([x0, x1]) => p.x > x0 && p.x < x1 && p.y > top && p.y < bottom + 8);
      if (hit && !p.isDashing && !this.dialogue.open) p.takeDamage(2, p.x, top);   // claws: 2 hearts
      this.time.delayedCall(200, () => { this.activeClaws = null; });
    });
  }

  hitEye() {
    const p = this.player;
    if (!p.isAttacking || this.headState !== 'resting' || this.ended || p.swingId === this.lastEyeSwing) return;
    this.lastEyeSwing = p.swingId;
    const dmg = p.strikeCharged ? 3 : 1;
    this.bossHp = Math.max(0, this.bossHp - dmg);
    this.bossBar.set(this.bossHp / R_MAX_HP);
    this.head.setTint(0xffffff);
    this.time.delayedCall(110, () => this.head.clearTint());
    this.splat(this.head.x + Phaser.Math.Between(-20, 20), this.head.y, 0xd8ff6a);
    if (p.strikeCharged) this.floatText(this.head.x, this.head.y - 50, 'CRITICAL!', '#d8ff6a');
    if (this.phase === 1 && this.bossHp <= 6) {
      if (this.restTimer) this.restTimer.remove();
      this.rise();
      this.time.delayedCall(700, () => this.startPhase2(false));
    } else if (this.phase === 3 && this.bossHp <= 0) {
      if (this.restTimer) this.restTimer.remove();
      this.confession();
    }
  }

  startPhase2(fromCheckpoint) {
    this.phase = 2;
    this.registry.set('a5Phase', 2);
    this.attackIndex = 0;
    this.regenAt = this.time.now + 1800;
    // No instructions at the bottom of the screen here: Gob works it out
    // himself in a mental note (Brad: less hand-holding, more Gob). The
    // "clink" on a normal hit is the only nudge toward the charged strike.
    this.setHint('');
    if (!fromCheckpoint) this.cameras.main.shake(700, 0.01);
    if (this.registry.get('a5P2NoteSeen')) return;
    this.nextAttackAt = this.time.now + 1e9;            // the dragon holds while Gob thinks
    this.regenAt = this.time.now + 1e9;
    this.time.delayedCall(fromCheckpoint ? 200 : 900, () => {
      this.playDialogue([
        { note: true, text: 'Green light. From the boxes, up the big S, into dragon. Dragon drinking it. Wounds closing. ...Boxes feed dragon.' },
      ], () => {
        this.registry.set('a5P2NoteSeen', true);
        this.nextAttackAt = this.time.now + 1200;
        this.regenAt = this.time.now + 2500;
      });
    });
  }

  hitConduit(c) {
    const p = this.player;
    if (!c.live || !p.isAttacking || p.swingId === c.lastSwing) return;
    c.lastSwing = p.swingId;
    if (!p.strikeCharged) { this.floatText(c.x, c.y - 30, 'clink!', '#c8c6d0'); return; }
    c.live = false;
    c.setFrame(1);
    for (let i = 0; i < 6; i++) this.splat(c.x + Phaser.Math.Between(-12, 12), c.y + Phaser.Math.Between(-16, 10), 0x96ffaa);
    this.cameras.main.shake(400, 0.012);
    this.cameras.main.flash(150, 150, 255, 170);
    this.bark(this.head, ['RRRAAAGH!'], '#96ffaa', 1200);
    if (this.phase === 2 && this.conduits.every((k) => !k.live)) this.startPhase3();
  }

  startPhase3() {
    this.phase = 3;
    this.bossHp = Math.min(this.bossHp, 8);
    if (this.bossBar) this.bossBar.set(this.bossHp / R_MAX_HP);
    this.registry.set('a5Phase', 3);
    this.attackIndex = 0;
    this.tweens.add({ targets: this.dark, fillAlpha: 0.28, duration: 1500 });
    this.cameras.main.shake(900, 0.01);
    this.bark(this.head, ['You dare starve me?!'], '#96ffaa', 2200);
    this.setHint('');
  }

  updatePhase2(time) {
    // energy ropes from the conduits to the S, and from the S into the dragon
    this.energy.clear();
    const live = this.conduits.filter((c) => c.live);
    if (this.phase <= 2 && live.length) {
      const a = 0.35 + 0.25 * Math.sin(time / 90);
      this.energy.lineStyle(3, 0x96ffaa, a);
      live.forEach((c) => this.energy.lineBetween(c.x, c.y - 20, 320, 60));
      this.energy.lineStyle(6, 0x96ffaa, a);
      this.energy.lineBetween(320, 60, this.head.x, this.head.y + 20);
    }
    if (this.phase === 2 && this.fighting && !this.ended && live.length && time > this.regenAt) {
      this.regenAt = time + 2500;
      if (this.bossHp < 9) {   // the S heals it, but never all the way back
        this.bossHp += 1;
        this.bossBar.set(this.bossHp / R_MAX_HP);
        this.floatText(this.head.x + 60, this.head.y, '+1', '#96ffaa');
      }
    }
  }

  updatePools(time) {
    this.fx.clear();
    this.pools = this.pools.filter((pl) => pl.until > time);
    this.pools.forEach((pl) => {
      this.fx.fillStyle(0x2a8a46, 0.45).fillCircle(pl.x, pl.y, pl.r);
      this.fx.lineStyle(1, 0x96ffaa, 0.6).strokeCircle(pl.x, pl.y, pl.r);
      const p = this.player;
      if (!p.isDashing && !this.ended && !this.dialogue.open && Phaser.Math.Distance.Between(p.x, p.y, pl.x, pl.y) < pl.r - 6) p.takeDamage(1, pl.x, pl.y);
    });
  }

  // ---------- the ending of the fight ----------

  confession() {
    this.ended = true;
    this.fighting = false;
    this.registry.set('a5Phase', 3);
    this.enemies.clear(true, true);
    this.pools = [];
    this.beamFx.clear();
    this.player.frozen = true;
    if (this.bossBar) this.bossBar.destroy();
    this.setHint('');
    this.headState = 'confess';
    this.head.setFrame(2);
    this.tweens.killTweensOf(this.head);
    this.head.setPosition(R_HEAD_REST.x, R_HEAD_REST.y);
    this.headBlock.body.enable = true;
    this.pushPlayerOutOfHead();
    this.player.setDepth(25);   // in front of the head for the confession + rage strike
    this.cameras.main.shake(500, 0.01);
    this.time.delayedCall(900, () => {
      this.playDialogue([
        { who: null, text: 'Solgorath sags against the edge of the roof, its cracked eye level with Gob.' },
        { who: 'Solgorath', text: 'You climb all this way for a city that never knew your name.' },
        { who: 'Solgorath', text: "You've been in that basement so long, you've forgotten...... Regardless.... I consumed your little coin. Barely a morsel." },
        { who: null, text: "Gob's eyes flare from green to red.", onShow: () => this.eyesRed() },
      ], () => this.startRage());
    });
  }

  eyesRed() {
    const p = this.player;
    p.setTexture('gob_red', p.frame.name);
    this.redTint = this.add.rectangle(320, 240, 640, 480, 0xff2030, 0).setScrollFactor(0).setDepth(91);
    this.tweens.add({ targets: this.redTint, fillAlpha: 0.2, duration: 600 });
    this.cameras.main.flash(250, 255, 60, 60);
  }

  startRage() {
    this.player.frozen = true;
    this.rage = { charge: 0, holding: false, done: false };
    this.ragePrompt = this.add.text(320, 400, 'HOLD SPACE', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ff6670', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setShadow(0, 0, '#ff2030', 10, true, true);
    this.tweens.add({ targets: this.ragePrompt, alpha: 0.35, duration: 400, yoyo: true, repeat: -1 });
    this.rageRing = this.add.graphics().setDepth(60);
    this.onRageDown = (ev) => { if (!ev || !ev.repeat) this.rage.holding = true; };
    this.onRageUp = () => { this.rage.holding = false; };
    // a short delay so the key press that closed the dialogue doesn't count
    this.time.delayedCall(350, () => {
      this.input.keyboard.on('keydown-SPACE', this.onRageDown);
      this.input.keyboard.on('keyup-SPACE', this.onRageUp);
    });
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-SPACE', this.onRageDown);
      this.input.keyboard.off('keyup-SPACE', this.onRageUp);
    });
  }

  updateRage(delta) {
    const r = this.rage;
    if (!r || r.done) return;
    if (r.holding) r.charge = Math.min(1000, r.charge + delta);
    else r.charge = Math.max(0, r.charge - delta * 1.5);
    const p = this.player;
    const f = r.charge / 1000;
    this.rageRing.clear();
    this.rageRing.lineStyle(3, 0xff3040, 0.4 + 0.6 * f).strokeCircle(p.x, p.y, 10 + 18 * f);
    this.rageRing.fillStyle(0xff3040, 0.15 * f).fillCircle(p.x, p.y, 10 + 18 * f);
    if (r.charge >= 1000) this.rageStrike();
  }

  rageStrike() {
    this.rage.done = true;
    this.ragePrompt.destroy();
    this.rageRing.clear();
    const p = this.player;
    p.direction = 'up';
    this.tweens.add({
      targets: p, x: R_HEAD_REST.x, y: R_HEAD_REST.y + 62, duration: 160, ease: 'Quad.In',
      onComplete: () => {
        p.anims.play('attack_up', true);
        p.setTexture('gob_red', 3 * GOB_COLS + 6);
        this.cameras.main.shake(400, 0.02);
        this.cameras.main.flash(160, 255, 80, 80);
        for (let i = 0; i < 10; i++) this.splat(this.head.x + Phaser.Math.Between(-30, 30), this.head.y + Phaser.Math.Between(-20, 20), i % 2 ? 0xd8ff6a : 0xff3040);
        this.time.delayedCall(900, () => {
          this.playDialogue([
            { who: null, text: "Gob's blade sinks into the cracked eye." },
            { who: 'Solgorath', text: '...Enough.' },
          ], () => this.theFlash());
        });
      },
    });
  }

  theFlash() {
    this.player.frozen = true;
    this.head.setFrame(1);
    const glow = this.add.circle(this.head.x, this.head.y - 8, 10, 0xd8ff6a, 1).setDepth(95);
    this.tweens.add({ targets: glow, radius: 30, duration: 500, yoyo: true, repeat: 1, onUpdate: () => glow.setRadius(glow.radius) });
    this.time.delayedCall(1100, () => {
      const white = this.add.rectangle(320, 240, 640, 480, 0xeaffd8, 0).setScrollFactor(0).setDepth(300);
      this.cameras.main.shake(1400, 0.02);
      this.tweens.add({
        targets: white, fillAlpha: 1, duration: 280,
        onComplete: () => {
          // the flash: Puc's sword breaks (the hilt survives) and the light
          // burns Gob's hearts down to 3, on screen. Chapter Two starts there.
          this.registry.set('swordBroken', true);
          this.registry.set('a5Phase', 1);
          this.registry.set('a5IntroSeen', false);
          this.registry.set('a5P2NoteSeen', false);
          this.time.delayedCall(700, () => this.drainHearts(() => this.scene.start('EndingScene')));
        },
      });
    });
  }

  // The countdown: hearts go out one by one from the end of the row, faster
  // and faster, then hold on 3. Drawn above the flash so it reads clearly.
  drainHearts(onDone) {
    const max = this.registry.get('maxHp');
    let hp = Math.max(this.player.hp, 3);
    const hearts = [];
    for (let i = 0; i < max; i++) {
      hearts.push(this.add.image(16 + (i % 10) * 17, 16 + Math.floor(i / 10) * 16, 'heart_pickup')
        .setScrollFactor(0).setDepth(310).setTint(i < hp ? 0xffffff : 0x3a1a2a));
    }
    let delay = 320;
    const step = () => {
      if (hp <= 3) {
        this.registry.set('hp', 3);
        // a long beat on 3, one flicker, and they hold
        this.time.delayedCall(900, () => {
          this.tweens.add({ targets: hearts.slice(0, 3), alpha: 0.25, duration: 90, yoyo: true, repeat: 1 });
          this.time.delayedCall(1400, onDone);
        });
        return;
      }
      hp -= 1;
      const h = hearts[hp];
      h.setTint(0xffffff);
      this.tweens.add({ targets: h, scale: 1.6, duration: 90, yoyo: true, onComplete: () => h.setTint(0x3a1a2a) });
      this.splat(h.x, h.y, 0xd8ff6a);
      this.cameras.main.shake(60, 0.003);
      delay = Math.max(70, delay * 0.84);
      this.time.delayedCall(delay, step);
    };
    this.time.delayedCall(600, step);
  }

  update(time, delta) {
    if (!this.player.isDead) this.player.update();
    this.enemies.getChildren().forEach((e) => e.update(time, this.player));
    this.updateBoss(time);
    this.updatePhase2(time);
    this.updatePools(time);
    this.updateRage(delta);
    this.updateNeck();
    if (this.activeSweep && !this.player.isDashing && !this.player.isDead && !this.dialogue.open && this.touchingNeck()) {
      this.player.takeDamage(2, this.head.x, this.head.y);   // neck sweep: 2 hearts
    }
    this.updateHud();
  }

  updateNeck() {
    if (!this.neckSegs || !this.head) return;
    // from the body to just behind the head, bowing slightly outward
    const bx = R_NECK_BASE.x; const by = R_NECK_BASE.y;
    const hx = this.head.x; const hy = this.head.y - 34;
    const n = this.neckSegs.length;
    this.neckSegs.forEach((s, i) => {
      const t = (i + 0.5) / n;
      const bow = Math.sin(t * Math.PI) * 14;
      const x = Phaser.Math.Linear(bx, hx, t) + bow * Math.sign(hx - bx || 1);
      const y = Phaser.Math.Linear(by, hy, t);
      s.setPosition(x, y).setVisible(this.head.visible && hy - by > 8);
      s.setAngle(Phaser.Math.RadToDeg(Math.atan2(hy - by, hx - bx)) - 90);
      s.setAlpha(this.head.alpha);
    });
  }
}
