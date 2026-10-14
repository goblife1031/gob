// Shared base for every playable area (Basement Row, Neon Market, and the
// areas still to come). An area subclass builds its own map, cast and story
// beats; everything common lives here: animations, the HUD, hints, area
// banners, the dialogue box, heart pickups, hit effects, death + retry, the
// stuck-key fix, and the NPC "SPACE: talk" helper.
const TILE = 32;
// Gob's sheet (PixelLab art, 64x64 cells): per row (down, left, right, up):
// stand, walk x4, swing windup, swing hit
const GOB_COLS = 7;
const GOB_ORIGIN_Y = 41 / 64;
// 48x48 PixelLab NPCs (Puc, Rugg): anchor so an 18x14 feet body at offset
// (15, 34) sits 7px below x,y, exactly where the old 32px NPC bodies were
const NPC48_ORIGIN_Y = 34 / 48;

class AreaScene extends Phaser.Scene {
  // ---------- setup helpers (call from the subclass's create) ----------

  initArea() {
    GameState.ensure(this.registry);
    this._leaving = false;
    this.npcs = [];
    this.buildAnimations();
  }

  finishArea(kicker, name, firstHint) {
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.fadeIn(500, 13, 6, 23);
    this.dialogue = new DialogueBox(this);
    this.buildHud();
    this.installKeyReset();
    this.player.on('noweapon', () => this.floatText(this.player.x, this.player.y - 26, 'Gob has nothing to swing.', '#b07ce6'));
    this.player.on('died', () => this.onPlayerDied());
    this.installPause();
    this.showAreaBanner(kicker, name);
    if (firstHint && typeof firstHint === 'object') this.think(firstHint.think);
    else if (firstHint) this.setHint(firstHint);
    window.__wogScene = this; // test/debug handle
  }

  buildAnimations() {
    const dirs = [
      { key: 'down', row: 0 }, { key: 'left', row: 1 },
      { key: 'right', row: 2 }, { key: 'up', row: 3 },
    ];
    dirs.forEach(({ key, row }) => {
      const base = row * GOB_COLS;
      if (!this.anims.exists(`walk_${key}`)) {
        this.anims.create({
          key: `walk_${key}`,
          frames: [base + 1, base + 2, base + 3, base + 4].map((f) => ({ key: 'gob', frame: f })),
          frameRate: 8, repeat: -1,
        });
      }
      if (!this.anims.exists(`attack_${key}`)) {
        this.anims.create({
          key: `attack_${key}`,
          frames: [base + 5, base + 6].map((f) => ({ key: 'gob', frame: f })),
          frameRate: 11, repeat: 0,
        });
      }
    });
    const twoFrame = (key, tex, rate) => {
      if (!this.anims.exists(key)) {
        this.anims.create({ key, frames: [0, 1].map((f) => ({ key: tex, frame: f })), frameRate: rate, repeat: -1 });
      }
    };
    if (!this.anims.exists('slime_idle')) {
      this.anims.create({ key: 'slime_idle', frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 4 }), frameRate: 6, repeat: -1, yoyo: true });
    }
    if (!this.anims.exists('puc_idle')) {
      this.anims.create({ key: 'puc_idle', frames: this.anims.generateFrameNumbers('puc', { start: 0, end: 2 }), frameRate: 3, repeat: -1, yoyo: true });
    }
    if (!this.anims.exists('rugg_idle')) {
      this.anims.create({ key: 'rugg_idle', frames: this.anims.generateFrameNumbers('rugg', { start: 0, end: 3 }), frameRate: 4, repeat: -1, yoyo: true });
    }
    if (!this.anims.exists('watch_walk')) this.anims.create({ key: 'watch_walk', frames: this.anims.generateFrameNumbers('watch', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    if (!this.anims.exists('drone_fly')) this.anims.create({ key: 'drone_fly', frames: this.anims.generateFrameNumbers('drone', { start: 0, end: 3 }), frameRate: 12, repeat: -1 });
    if (!this.anims.exists('rat_run')) this.anims.create({ key: 'rat_run', frames: this.anims.generateFrameNumbers('rat', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    if (!this.anims.exists('wick_walk')) this.anims.create({ key: 'wick_walk', frames: this.anims.generateFrameNumbers('wick', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    if (!this.anims.exists('rugg_eyes')) {
      this.anims.create({ key: 'rugg_eyes', frames: [4, 5].map((f) => ({ key: 'rugg', frame: f })), frameRate: 2, repeat: -1 });
    }
    for (let v = 0; v < 3; v++) {
      if (!this.anims.exists(`folk_${v}`)) {
        this.anims.create({ key: `folk_${v}`, frames: [v * 2, v * 2 + 1].map((f) => ({ key: 'townsfolk', frame: f })), frameRate: 3, repeat: -1 });
      }
    }
  }

  // Builds a tilemap from a 2D array of tile indices (-1 = empty).
  buildTilemap(data, collides) {
    this.map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = this.map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    this.layer = this.map.createLayer(0, tileset, 0, 0);
    this.layer.setCollision(collides);
    return this.layer;
  }

  // The distant skyline band at the top of an area: the S Corp tower and its
  // neon "S" (the game's compass), plus a hidden dragon silhouette for
  // story beats. `closeness` 0..1 makes the tower bigger in later areas.
  // `art`: a painted PixelLab skyline (assets/backdrops) to use instead of the
  // code-drawn one. Its tallest tower sits at x=455, so the S goes there.
  drawSkyline(widthPx, skyRows, closeness = 0, art = null) {
    if (art && this.textures.exists(art)) {
      this.add.image(0, 0, art).setOrigin(0, 0).setDepth(-10);
      return this.skylineExtras(455, 6, closeness, 0.85);
    }
    const skyH = skyRows * TILE;
    const cx = widthPx / 2;
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0x0b0514, 1).fillRect(0, 0, widthPx, skyH);
    g.fillStyle(0x5ad678, 0.08 + 0.06 * closeness).fillRect(0, 0, widthPx, skyH);
    const far = [[0, 70, 60], [55, 50, 40], [100, 80, 55], [160, 60, 45], [420, 66, 50], [470, 44, 60], [530, 76, 45], [575, 58, 65]];
    far.forEach(([x, y, w]) => g.fillStyle(0x1c0f2e, 1).fillRect(x, y, w, skyH - y));
    const tw = 60 + 30 * closeness;
    const top = 14 - 10 * closeness;
    g.fillStyle(0x140a22, 1).fillRect(cx - tw / 2, top, tw, skyH - top);
    g.fillStyle(0x4de1ff, 0.25);
    for (let wy = top + 42; wy < skyH - 6; wy += 12) { g.fillRect(cx - tw / 2 + 8, wy, 6, 5); g.fillRect(cx + tw / 2 - 14, wy, 6, 5); }

    return this.skylineExtras(cx, top, closeness, 1);
  }

  skylineExtras(cx, top, closeness, sScale) {
    this.dragonShadow = this.add.image(cx, 70, 'dragon_placeholder')
      .setTint(0x020602).setAlpha(0).setScale(0.75 + 0.2 * closeness).setDepth(-9);
    this.sSign = this.add.text(cx, top + 20 + 4 * closeness, 'S', {
      fontFamily: '"Arial Black", Impact, sans-serif', fontSize: `${Math.round((38 + 16 * closeness) * sScale)}px`, color: '#4de1ff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(-8).setShadow(0, 0, '#4de1ff', 14, true, true);
    this.tweens.add({ targets: this.sSign, alpha: 0.7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  // True if nothing solid on the tilemap sits between the two points.
  lineOfSight(x1, y1, x2, y2) {
    const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const steps = Math.ceil(dist / 8);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tile = this.layer.getTileAtWorldXY(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
      if (tile && tile.collides) return false;
    }
    return true;
  }

  // ---------- enemy projectiles ----------

  buildShots() {
    this.shots = this.physics.add.group();
    this.physics.add.collider(this.shots, this.layer, (shot) => { this.splat(shot.x, shot.y, 0x7c3ac6); shot.destroy(); });
    this.physics.add.overlap(this.player, this.shots, (player, shot) => {
      if (player.isDashing) return;              // dash straight through it
      player.takeDamage(1, shot.x, shot.y);
      shot.destroy();
    });
    this.physics.add.overlap(this.player.attackHitbox, this.shots, (hb, shot) => {
      if (!this.player.isAttacking) return;
      this.floatText(shot.x, shot.y - 8, 'tink!', '#eee7f8');
      this.splat(shot.x, shot.y, 0xeee7f8);
      shot.destroy();
    });
  }

  fireShot(x, y, tx, ty, speed = 150, texture = 'can_shot') {
    const shot = this.shots.create(x, y, texture).setDepth(11);
    shot.body.setSize(8, 8);
    const v = new Phaser.Math.Vector2(tx - x, ty - y).normalize().scale(speed);
    shot.body.setVelocity(v.x, v.y);
    shot.setAngularVelocity(540);
    this.time.delayedCall(3500, () => shot.active && shot.destroy());
    return shot;
  }

  // ---------- NPCs ----------

  // Registers a talkable NPC. getLines() returns the dialogue for this talk;
  // onDone runs after it closes.
  addNpc(sprite, getLines, onDone, label = 'SPACE: talk') {
    const prompt = this.add.text(sprite.x, sprite.y - 30, label, {
      fontFamily: 'monospace', fontSize: '10px', color: '#5ad678', backgroundColor: '#1a0e2acc', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false);
    const npc = { sprite, getLines, onDone, prompt };
    this.npcs.push(npc);
    return npc;
  }

  nearNpc() {
    if (!this.dialogue || this.dialogue.open) return null;
    return this.npcs.find((n) => {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, n.sprite.x, n.sprite.y) >= 56) return false;
      // with a sword in hand, SPACE beside someone swings unless Gob faces them
      return !this.player.hasSword || this.isFacing(n.sprite);
    }) || null;
  }

  isFacing(target) {
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const want = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    return this.player.direction === want;
  }

  // Player calls this on SPACE before swinging; true = handled as a talk.
  tryInteract() {
    const npc = this.nearNpc();
    if (!npc) return false;
    this.talkTo(npc);
    return true;
  }

  talkTo(npc) {
    npc.sprite.setFlipX(this.player.x < npc.sprite.x);
    this.playDialogue(npc.getLines(), npc.onDone);
  }

  // Freezes Gob for the length of a dialogue.
  playDialogue(lines, onDone) {
    this.player.frozen = true;
    this.dialogue.show(lines, () => {
      this.player.frozen = false;
      this.player.clearInput(); // swallow the closing keypress
      if (onDone) onDone();
    });
  }

  // Non-blocking speech bubbles over a sprite, one after another.
  bark(sprite, lines, color = '#eee7f8', each = 2300) {
    lines.forEach((text, i) => {
      this.time.delayedCall(i * each, () => {
        if (!sprite.active) return;
        // keep the bubble on screen even when the speaker is near an edge
        const view = this.cameras.main.worldView;
        const bx = Phaser.Math.Clamp(sprite.x, view.x + 124, view.right - 124);
        const t = this.add.text(bx, sprite.y - 34, text, {
          fontFamily: 'monospace', fontSize: '10px', color, backgroundColor: '#1a0e2ae6',
          padding: { x: 5, y: 3 }, wordWrap: { width: 230 }, align: 'center',
        }).setOrigin(0.5, 1).setDepth(40);
        this.tweens.add({ targets: t, alpha: 0, delay: each - 300, duration: 280, onComplete: () => t.destroy() });
      });
    });
  }

  // ---------- pickups / effects ----------

  buildPickups() {
    this.hearts = this.physics.add.group();
    this.physics.add.overlap(this.player, this.hearts, (player, heart) => {
      if (player.hp >= player.maxHp) return;
      player.heal(2);
      this.floatText(heart.x, heart.y - 10, '+2', '#ff6688');
      heart.destroy();
    });
  }

  // A heart container pickup: +1 max heart and a full refill.
  spawnHeartContainer(x, y, onDone) {
    const hc = this.physics.add.staticImage(x, y, 'heart_container').setDepth(8);
    this.tweens.add({ targets: hc, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
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
      ], onDone);
    });
    return hc;
  }

  maybeDropHeart(x, y, chance = 0.35) {
    if (Math.random() > chance) return;
    const h = this.hearts.create(x, y, 'heart_pickup').setDepth(8);
    this.tweens.add({ targets: h, y: y - 4, duration: 500, yoyo: true, repeat: -1 });
    this.time.delayedCall(9000, () => h.active && this.tweens.add({ targets: h, alpha: 0, duration: 400, onComplete: () => h.destroy() }));
  }

  splat(x, y, color) {
    const puff = this.add.circle(x, y, 4, color, 0.8).setDepth(15);
    this.tweens.add({
      targets: puff, radius: 18, alpha: 0, duration: 260,
      onUpdate: () => puff.setRadius(puff.radius),
      onComplete: () => puff.destroy(),
    });
  }

  floatText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '11px', color, backgroundColor: '#0d0617aa', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, delay: 500, duration: 700, onComplete: () => t.destroy() });
  }

  // ---------- HUD ----------

  buildHud() {
    this.hudHearts = [];
    this.refreshHeartsHud();
    this.hintBg = this.add.rectangle(320, 466, 640, 24, 0x0d0617, 0.75).setScrollFactor(0).setDepth(99);
    this.hintText = this.add.text(320, 466, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#b07ce6',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  // (Re)builds the heart row, e.g. after a heart container raises max hearts.
  refreshHeartsHud() {
    this.hudHearts.forEach((h) => h.destroy());
    this.hudHearts = [];
    for (let i = 0; i < this.player.maxHp; i++) {
      // two rows of up to 10, Zelda-style
      this.hudHearts.push(this.add.image(16 + (i % 10) * 17, 16 + Math.floor(i / 10) * 16, 'heart_pickup').setScrollFactor(0).setDepth(100));
    }
  }

  // A labelled bar pinned to the top-center of the screen (boss health, the
  // crowd's morale...). Returns { set(fraction), destroy() }.
  makeBar(label, color, y = 40) {
    const bg = this.add.rectangle(320, y, 260, 10, 0x1a0e2a, 0.9).setStrokeStyle(1, 0xeee7f8).setScrollFactor(0).setDepth(100);
    const fill = this.add.rectangle(191, y, 258, 8, color).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    const txt = this.add.text(320, y - 14, label, { fontFamily: 'monospace', fontSize: '11px', color: '#eee7f8' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);
    return {
      set: (f) => { fill.width = Math.max(0, 258 * Phaser.Math.Clamp(f, 0, 1)); },
      destroy: () => { bg.destroy(); fill.destroy(); txt.destroy(); },
    };
  }

  // Mechanics lessons (move, swing, dash, charge): plain purple, stays up.
  setHint(text) {
    if (this.thinkTimer) { this.thinkTimer.remove(); this.thinkTimer = null; }
    this.tweens.killTweensOf([this.hintText, this.hintBg]);
    this.hintText.setText(text).setStyle({ color: '#b07ce6', fontStyle: 'normal' });
    this.hintBg.setAlpha(0.75);
    this.hintText.setAlpha(0);
    this.tweens.add({ targets: this.hintText, alpha: 1, duration: 250 });
  }

  // Everything else is a passing thought in Gob's own voice: green italic,
  // and it fades on its own. A nudge, not a set of instructions.
  think(text, ms = 5500) {
    if (!text) { this.setHint(''); return; }
    this.setHint('');
    this.hintText.setText(`"${text}"`).setStyle({ color: '#9fe6b0', fontStyle: 'italic' });
    this.thinkTimer = this.time.delayedCall(ms, () => {
      this.thinkTimer = null;
      this.tweens.add({ targets: [this.hintText, this.hintBg], alpha: 0, duration: 600 });
    });
  }

  showAreaBanner(kicker, name) {
    const k = this.add.text(320, 150, kicker, { fontFamily: 'monospace', fontSize: '12px', color: '#5ad678' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(200);
    const n = this.add.text(320, 172, name, { fontFamily: 'monospace', fontSize: '22px', color: '#b07ce6' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(200).setShadow(0, 0, '#7c3ac6', 10, true, true);
    this.tweens.add({ targets: [k, n], alpha: 0, delay: 1800, duration: 700, onComplete: () => { k.destroy(); n.destroy(); } });
  }

  updateHud() {
    this.hudHearts.forEach((h, i) => h.setTint(i < this.player.hp ? 0xffffff : 0x3a1a2a));
    const near = this.nearNpc();
    this.npcs.forEach((n) => n.prompt.setVisible(n === near).setPosition(n.sprite.x, n.sprite.y - 30));
  }

  onPlayerDied() {
    this.player.setTint(0x553355);
    this.player.anims.stop();
    this.add.rectangle(320, 240, 640, 480, 0x000000, 0.6).setScrollFactor(0).setDepth(300);
    this.add.text(320, 230, 'Gob has fallen.', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff6688',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(320, 262, 'SPACE to get back up', {
      fontFamily: 'monospace', fontSize: '12px', color: '#5ad678',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.time.delayedCall(600, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        this.registry.set('hp', this.registry.get('maxHp'));
        this.scene.restart();
      });
    });
  }

  // ESC pauses: freezes this scene (physics, timers, tweens) and opens the
  // PauseScene overlay on top of it.
  installPause() {
    this.input.keyboard.on('keydown-ESC', () => {
      if (this._leaving || this.player.isDead || this.scene.isPaused()) return;
      this.scene.launch('PauseScene', { from: this.scene.key });
      this.scene.pause();
    });
    this.events.on('resume', () => {
      if (this.input.keyboard) this.input.keyboard.resetKeys();
      if (this.player) { this.player.attackHeld = false; this.player.cancelCharge(); this.player.clearInput(); }
    });
  }

  installKeyReset() {
    // Releasing a key didn't always stop movement: if the page loses focus
    // while a key is held (common in an embedded view), the browser never
    // sends that key's keyup and Phaser keeps it "down". Clear all key
    // state whenever focus or visibility is lost.
    const resetKeys = () => {
      if (this.input.keyboard) this.input.keyboard.resetKeys();
      if (this.player) { this.player.attackHeld = false; this.player.cancelCharge(); }
    };
    const onVis = () => { if (document.hidden) resetKeys(); };
    this.game.events.on(Phaser.Core.Events.BLUR, resetKeys);
    window.addEventListener('blur', resetKeys);
    document.addEventListener('visibilitychange', onVis);
    this.events.once('shutdown', () => {
      this.game.events.off(Phaser.Core.Events.BLUR, resetKeys);
      window.removeEventListener('blur', resetKeys);
      document.removeEventListener('visibilitychange', onVis);
    });
  }
}
