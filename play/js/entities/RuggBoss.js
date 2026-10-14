// RUGG — Area 3 mini-boss (comic villain, a rug-pull in person).
// Moves:
//   COIN FAN   throws a spread of "dragon-proof" coins at Gob (swat or dash through)
//   RUG PULL   a rug outline appears under Gob; a moment later Rugg yanks it.
//              Still standing on it = 1 damage + yanked toward Rugg. Step or dash off.
//   CHARGE     (phase 2 only) winds up, flashing, then barrels across the plaza
// Phase 2 starts at half health: faster, wider coin fans, and he calls in rats
// (which always drop a heart). Touching Rugg only hurts while he's charging;
// otherwise he just shoves Gob back, so getting in close to hit him is fair.
// The scene drives him via update(); he reports 'phase2' and 'defeated' events.
class RuggBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'rugg', 4);
    this.setOrigin(0.5, 0.573);   // 48px art: body sits where it did with the old 32px x1.25 sprite
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.body.setSize(28, 22).setOffset(10, 24);
    this.setDepth(9);

    this.maxHp = 10;
    this.hp = this.maxHp;
    this.phase = 1;
    this.fighting = false;
    this.lastSwingId = -1;
    this.invulnUntil = 0;
    this.stunUntil = 0;
    this.nextMoveAt = 0;
    this.busyUntil = 0;
    this.charging = false;
    this.moveIndex = 0;
    this.anims.play('rugg_eyes');
  }

  startFight() {
    this.fighting = true;
    this.nextMoveAt = this.scene.time.now + 900;
  }

  takeHit(swingId, fromX, fromY) {
    const now = this.scene.time.now;
    if (!this.fighting || swingId === this.lastSwingId || now < this.invulnUntil || this.hp <= 0) return false;
    this.lastSwingId = swingId;
    this.hp -= 1;
    this.invulnUntil = now + 350;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(110, () => this.active && this.clearTint());
    if (!this.charging) {
      const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize().scale(170);
      this.body.setVelocity(away.x, away.y);
      this.stunUntil = now + 200;
    }
    if (this.phase === 1 && this.hp <= this.maxHp / 2) {
      this.phase = 2;
      this.emit('phase2');
    }
    if (this.hp <= 0) {
      this.fighting = false;
      this.body.setVelocity(0, 0);
      this.emit('defeated');
    }
    return true;
  }

  update(time, player, scene) {
    if (!this.fighting || player.isDead) { if (!this.charging) this.body.setVelocity(0, 0); return; }
    if (this.charging || time < this.stunUntil || time < this.busyUntil) return;

    // drift to keep a comfortable distance and sidestep
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const want = 130;
    const speed = this.phase === 2 ? 75 : 55;
    const toward = new Phaser.Math.Vector2(dx, dy).normalize();
    const side = new Phaser.Math.Vector2(-toward.y, toward.x).scale(Math.sin(time / 700));
    const push = dist > want + 20 ? 1 : (dist < want - 30 ? -1 : 0);
    this.body.setVelocity((toward.x * push + side.x) * speed, (toward.y * push + side.y) * speed);
    this.setFlipX(dx < 0);

    if (time >= this.nextMoveAt) this.doMove(time, player, scene);
  }

  doMove(time, player, scene) {
    const order = this.phase === 1 ? ['coins', 'rug', 'coins', 'rug'] : ['coins', 'charge', 'rug', 'coins', 'charge'];
    const move = order[this.moveIndex % order.length];
    this.moveIndex += 1;
    this.body.setVelocity(0, 0);
    if (move === 'coins') this.coinFan(scene, player);
    if (move === 'rug') this.rugPull(scene, player);
    if (move === 'charge') this.charge(scene, player);
    this.nextMoveAt = time + (this.phase === 1 ? 2100 : 1600);
  }

  coinFan(scene, player) {
    this.busyUntil = scene.time.now + 600;
    this.setFrame(5);
    scene.time.delayedCall(350, () => {
      if (!this.active || !this.fighting) return;
      this.setFrame(4);
      const n = this.phase === 1 ? 3 : 5;
      const spread = Phaser.Math.DegToRad(this.phase === 1 ? 32 : 56);
      const base = Math.atan2(player.y - this.y, player.x - this.x);
      for (let i = 0; i < n; i++) {
        const a = base - spread / 2 + (spread * i) / (n - 1);
        scene.fireShot(this.x, this.y, this.x + Math.cos(a) * 100, this.y + Math.sin(a) * 100, 165, 'coin_shot');
      }
    });
  }

  rugPull(scene, player) {
    this.busyUntil = scene.time.now + 500;
    const w = 84; const h = 64;
    const rx = player.x; const ry = player.y + 6;
    const warn = this.phase === 1 ? 950 : 750;
    scene.activeRug = { x: rx, y: ry, w, h }; // exposed for tests / future AI helpers
    const rug = scene.add.rectangle(rx, ry, w, h, 0x8a2040, 0.35).setStrokeStyle(2, 0xff6688).setDepth(3);
    scene.tweens.add({ targets: rug, alpha: 0.85, duration: 140, yoyo: true, repeat: Math.floor(warn / 280) });
    scene.bark(this, [Phaser.Utils.Array.GetRandom(['Watch your step!', 'Rug PULL!', 'Hold still, kid.', 'Read the fine print!'])], '#ffe08a', 1100);
    scene.time.delayedCall(warn, () => {
      if (!this.active) { rug.destroy(); return; }
      scene.activeRug = null;
      const on = Math.abs(player.x - rx) < w / 2 && Math.abs(player.y - ry) < h / 2;
      if (on && !player.isDashing && !player.isDead) {
        player.takeDamage(1, rx + (rx - this.x), ry + (ry - this.y)); // yanked toward Rugg
        scene.floatText(player.x, player.y - 26, 'YANKED!', '#ff6688');
      }
      scene.tweens.add({ targets: rug, x: this.x, y: this.y, scaleX: 0.2, scaleY: 0.2, alpha: 0, duration: 260, onComplete: () => rug.destroy() });
    });
  }

  charge(scene, player) {
    this.busyUntil = scene.time.now + 1300;
    this.setTint(0xff9966);
    scene.tweens.add({ targets: this, alpha: 0.5, duration: 90, yoyo: true, repeat: 2 });
    scene.time.delayedCall(560, () => {
      if (!this.active || !this.fighting) return;
      this.clearTint();
      this.charging = true;
      const v = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize().scale(310);
      this.body.setVelocity(v.x, v.y);
      scene.time.delayedCall(560, () => { this.charging = false; if (this.active) this.body.setVelocity(0, 0); });
    });
  }
}
