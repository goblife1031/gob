// Gob — the player character. Programmer-art sprite (assets/sprites/gob.png);
// drop-in replace the PNG later with real pixel art using the same frame layout:
// 4 rows (down, left, right, up) x 5 cols (walk0, walk1, walk2, attack_windup, attack_impact).
//
// DASH (SHIFT, once learned in Area 2): a short burst in the direction Gob
// is moving/facing. Gob can't be hurt mid-dash, which is how he crosses
// sparking cables and slips through attacks.
//
// CHARGED SWING (once learned in Area 4): tap SPACE swings as always; keep
// holding and a purple aura builds; release once it's bright for a big
// strike (wider reach, 3 damage, the only thing that breaks gargoyles).
//
// Hearts, the sword and the dash live in the game registry (see GameState.js) so they
// carry across areas. SPACE is context-sensitive: if the scene has something
// to interact with nearby (scene.tryInteract returns true) it talks instead
// of swinging; with no sword yet, it just says so.
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'gob', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // 64x64 frame: anchor so the feet-only body sits where it did with the old
    // 32px art (7px below x,y), keeping every trigger and spawn point valid
    this.setOrigin(0.5, GOB_ORIGIN_Y);
    this.body.setSize(18, 12).setOffset(23, 42);
    this.setDepth(10);

    this.speed = 120;
    this.direction = 'up';
    this.isAttacking = false;
    this.attackReadyAt = 0;   // timestamp, not a timer: can't drift or get stuck
    this.invincible = false;
    this.frozen = false;
    this.knockbackUntil = 0;
    this.swingId = 0;
    this.isDashing = false;
    this.dashUntil = 0;
    this.dashReadyAt = 0;
    this.nextGhostAt = 0;

    const reg = scene.registry;
    this.maxHp = reg.get('maxHp');
    this.hp = reg.get('hp');

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    // Input: SPACE / SHIFT presses are captured from the key-down EVENT and
    // held for a short window, instead of polling "just pressed" each frame.
    // Polling could miss a quick tap (down+up inside one frame) or a press
    // made mid-knockback, which made swings feel like they randomly failed.
    this.pressedAttackAt = -1;
    this.pressedDashAt = -1;
    this.attackHeld = false;
    this.holdStartAt = 0;
    this.charging = false;
    this.chargeReady = false;
    this.strikeCharged = false;
    const onAttack = (ev) => {
      if (ev && ev.repeat) return;           // ignore OS key-repeat while holding
      this.pressedAttackAt = scene.time.now;
      this.attackHeld = true;
      this.holdStartAt = scene.time.now;   // (re)starts the charge timer
    };
    const onAttackUp = () => { this.attackHeld = false; };
    const onDash = (ev) => { if (ev && ev.repeat) return; this.pressedDashAt = scene.time.now; };
    scene.input.keyboard.on('keydown-SPACE', onAttack);
    scene.input.keyboard.on('keyup-SPACE', onAttackUp);
    scene.input.keyboard.on('keydown-SHIFT', onDash);
    scene.events.once('shutdown', () => {
      scene.input.keyboard.off('keydown-SPACE', onAttack);
      scene.input.keyboard.off('keyup-SPACE', onAttackUp);
      scene.input.keyboard.off('keydown-SHIFT', onDash);
    });
    // charge aura
    this.aura = scene.add.circle(x, y, 17, 0xb07ce6, 0).setStrokeStyle(2, 0xb07ce6, 0).setDepth(9);

    // attack hitbox — a short-lived invisible zone placed in front of Gob
    this.attackHitbox = scene.add.zone(x, y, 22, 22);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;

    this.on('animationcomplete', (anim) => {
      if (anim.key.startsWith('attack_')) this.endAttack();
    });
  }

  get hasSword() {
    return !!this.scene.registry.get('hasSword');
  }

  endAttack() {
    this.isAttacking = false;
    this.attackHitbox.body.enable = false;
    if (this.strikeCharged) {
      this.strikeCharged = false;
      this.attackHitbox.setSize(22, 22);
      this.attackHitbox.body.setSize(22, 22);
    }
  }

  get hasCharge() {
    return !!this.scene.registry.get('hasCharge');
  }

  cancelCharge() {
    this.charging = false;
    this.chargeReady = false;
    this.aura.setFillStyle(0xb07ce6, 0).setStrokeStyle(2, 0xb07ce6, 0);
  }

  updateCharge(now) {
    this.aura.setPosition(this.x, this.y + 4);
    if (!this.hasCharge) return;
    if (this.attackHeld && !this.isAttacking && now - this.holdStartAt > 300) {
      this.charging = true;
      const t = Phaser.Math.Clamp((now - this.holdStartAt - 300) / 600, 0, 1);
      if (t >= 1 && !this.chargeReady) {
        this.chargeReady = true;
        this.scene.cameras.main.flash(60, 176, 124, 230);
      }
      const pulse = this.chargeReady ? 0.55 + 0.35 * Math.sin(now / 50) : 0.25 * t;
      this.aura.setRadius(10 + 9 * t).setFillStyle(0xb07ce6, pulse * 0.4).setStrokeStyle(2, 0xb07ce6, pulse + 0.2);
    } else if (this.charging && !this.attackHeld) {
      const ready = this.chargeReady;
      this.cancelCharge();
      if (ready && !this.isAttacking) this.chargedStrike();
    }
  }

  chargedStrike() {
    const now = this.scene.time.now;
    this.isAttacking = true;
    this.strikeCharged = true;
    this.swingId += 1;
    this.attackReadyAt = now + 420;
    this.attackEndsAt = now + 380;
    this.body.setVelocity(0, 0);
    this.attackHitbox.setSize(50, 50);
    this.attackHitbox.body.setSize(50, 50);
    this.attackHitbox.body.enable = true;
    this.anims.play(`attack_${this.direction}`, true);
    this.positionAttackHitbox();
    const ring = this.scene.add.circle(this.attackHitbox.x, this.attackHitbox.y, 8, 0xb07ce6, 0.6).setDepth(15);
    this.scene.tweens.add({ targets: ring, radius: 34, alpha: 0, duration: 260, onUpdate: () => ring.setRadius(ring.radius), onComplete: () => ring.destroy() });
    this.scene.cameras.main.shake(120, 0.006);
    this.emit('chargedStrike');
  }

  clearInput() {
    this.pressedAttackAt = -1;
    this.pressedDashAt = -1;
    if (this.charging) this.cancelCharge();
    this.holdStartAt = this.scene.time.now + 1e9; // a hold that started before now no longer counts
  }

  // true if the key was pressed within the last `window` ms (and consumes it)
  takePress(which, window = 260) {
    const key = which === 'attack' ? 'pressedAttackAt' : 'pressedDashAt';
    const t = this[key];
    if (t < 0 || this.scene.time.now - t > window) return false;
    this[key] = -1;
    return true;
  }

  peekPress(which, window = 260) {
    const t = which === 'attack' ? this.pressedAttackAt : this.pressedDashAt;
    return t >= 0 && this.scene.time.now - t <= window;
  }

  get hasDash() {
    return !!this.scene.registry.get('hasDash');
  }

  setHp(hp) {
    this.hp = Phaser.Math.Clamp(hp, 0, this.maxHp);
    this.scene.registry.set('hp', this.hp);
  }

  heal(amount) {
    this.setHp(this.hp + amount);
  }

  // srcX/srcY: where the hit came from, so Gob gets shoved away from it.
  // Without knockback a slime could sit on Gob and land a hit every time the
  // invincibility window ran out (6 hearts gone in ~3 seconds in testing).
  takeDamage(amount, srcX, srcY) {
    if (this.invincible || this.isDead || this.isDashing) return;
    if (Dev.god) return;   // dev loophole: no damage
    this.setHp(this.hp - amount);
    this.invincible = true;
    this.setTint(0xff6666);
    this.scene.cameras.main.shake(90, 0.004);

    if (srcX !== undefined) {
      const away = new Phaser.Math.Vector2(this.x - srcX, this.y - srcY);
      if (away.lengthSq() === 0) away.set(0, 1);
      away.normalize().scale(240);
      this.body.setVelocity(away.x, away.y);
      this.knockbackUntil = this.scene.time.now + 160;
      this.isAttacking = false;
      this.attackHitbox.body.enable = false;
    }

    this.scene.tweens.add({ targets: this, alpha: 0.35, duration: 90, yoyo: true, repeat: 4 });
    this.scene.time.delayedCall(900, () => {
      this.invincible = false;
      this.clearTint();
      this.setAlpha(1);
    });
    if (this.hp <= 0) {
      this.isDead = true;
      this.body.setVelocity(0, 0);
      this.emit('died');
    }
  }

  // Push Gob away from a point without hurting him (e.g. bouncing off a
  // hazard while he's still invincible from the last hit).
  shove(srcX, srcY, force = 220) {
    const away = new Phaser.Math.Vector2(this.x - srcX, this.y - srcY);
    if (away.lengthSq() === 0) away.set(0, 1);
    away.normalize().scale(force);
    this.body.setVelocity(away.x, away.y);
    this.knockbackUntil = this.scene.time.now + 150;
  }

  startDash(dx, dy) {
    const v = new Phaser.Math.Vector2(dx, dy);
    if (v.lengthSq() === 0) {
      const f = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[this.direction];
      v.set(f[0], f[1]);
    }
    v.normalize().scale(460);
    this.isDashing = true;
    this.dashUntil = this.scene.time.now + 220;
    this.dashReadyAt = this.scene.time.now + 600;
    this.body.setVelocity(v.x, v.y);
    this.setTint(0xc9a0ff);
    this.emit('dash');
  }

  spawnGhost() {
    const g = this.scene.add.image(this.x, this.y, 'gob', this.frame.name).setOrigin(0.5, GOB_ORIGIN_Y)
      .setTint(0x7c3ac6).setAlpha(0.55).setDepth(this.depth - 1);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  update() {
    if (this.isDead) { this.cancelCharge(); return; }
    const now = this.scene.time.now;
    this.updateCharge(now);

    if (this.isDashing) {
      if (now >= this.dashUntil) {
        this.isDashing = false;
        this.body.setVelocity(0, 0);
        if (!this.invincible) this.clearTint();
      } else {
        if (now >= this.nextGhostAt) { this.spawnGhost(); this.nextGhostAt = now + 35; }
        return;
      }
    }

    if (now < this.knockbackUntil) return; // ride out the shove (presses stay queued)
    if (this.frozen) {
      this.clearInput();
      this.endAttack();   // a dialogue that opens mid-swing must not leave Gob stuck "attacking"
      this.body.setVelocity(0, 0);
      this.anims.stop();
      this.setFrame(this.walkIdleFrame());
      return;
    }

    if (this.isAttacking) {
      // safety net: never stay in a swing longer than it should take
      if (now > this.attackEndsAt) { this.endAttack(); } else {
      this.body.setVelocity(0, 0);
      this.positionAttackHitbox();
      return;   // a press made mid-swing stays queued and fires right after
      }
    }

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let vx = 0, vy = 0;
    if (left) { vx = -1; this.direction = 'left'; }
    else if (right) { vx = 1; this.direction = 'right'; }
    if (up) { vy = -1; this.direction = 'up'; }
    else if (down) { vy = 1; this.direction = 'down'; }

    const moving = vx !== 0 || vy !== 0;
    const vec = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.charging ? this.speed * 0.55 : this.speed);
    this.body.setVelocity(vec.x, vec.y);
    if (moving) this.emit('moved');

    if (this.hasDash && now >= this.dashReadyAt && this.takePress('dash', 200)) {
      this.startDash(vx, vy);
      return;
    }

    if (moving) {
      this.anims.play(`walk_${this.direction}`, true);
    } else {
      this.anims.stop();
      this.setFrame(this.walkIdleFrame());
    }

    if (this.peekPress('attack')) {
      if (this.scene.tryInteract && this.scene.tryInteract()) { this.clearInput(); return; }
      if (!this.hasSword) {
        this.clearInput();
        this.emit('noweapon');
        return;
      }
      // a press that lands just before the cooldown ends waits for it,
      // so fast double-taps both swing
      if (now >= this.attackReadyAt) {
        this.takePress('attack');
        this.startAttack();
      }
    }
  }

  walkIdleFrame() {
    const row = { down: 0, left: 1, right: 2, up: 3 }[this.direction];
    return row * GOB_COLS; // the standing pose of that row
  }

  startAttack() {
    this.isAttacking = true;
    this.attackReadyAt = this.scene.time.now + 260;
    this.attackEndsAt = this.scene.time.now + 320;
    this.swingId += 1; // each swing hits a given target at most once
    this.body.setVelocity(0, 0);
    this.anims.play(`attack_${this.direction}`, true);
    this.attackHitbox.body.enable = true;
    this.positionAttackHitbox();
    this.emit('swing');
  }

  positionAttackHitbox() {
    const r = this.strikeCharged ? 24 : 18;
    const offsets = {
      down: [0, r], up: [0, -r], left: [-r, 0], right: [r, 0],
    };
    const [ox, oy] = offsets[this.direction];
    this.attackHitbox.setPosition(this.x + ox, this.y + oy);
  }
}
