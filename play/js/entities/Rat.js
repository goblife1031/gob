// Corrupted river rat (Area 3's new enemy). Fast and fragile: one hit kills,
// but they come in numbers. Like slimes, they can be given a `goal` to run
// at (the crowd on the bridge) and will turn on Gob if he gets close.
class Rat extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'rat', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 29 / 48);   // 48px art: body sits where the old 32px one did
    this.body.setSize(18, 10).setOffset(16, 29);
    this.setDepth(9);
    this.hp = 1;
    this.speed = 80;
    this.aggroRange = 70;      // used when hunting Gob (no goal)
    this.snapRange = 36;       // with a goal they only snap at Gob if he's right on them
    this.stunUntil = 0;
    this.lastSwingId = -1;
    this.goal = null;
    this.anims.play('rat_run');
  }

  emerge() {
    this.stunUntil = this.scene.time.now + 450;
    this.setScale(0.1).setAlpha(0.4);
    this.scene.tweens.add({ targets: this, scale: 1, alpha: 1, duration: 400, ease: 'Back.Out' });
    return this;
  }

  takeHit(swingId, fromX, fromY, dmg = 1) {
    if (swingId === this.lastSwingId) return false;
    this.lastSwingId = swingId;
    this.hp -= dmg;
    if (this.hp <= 0) { this.destroy(); return true; }
    return false;
  }

  recoil(fromX, fromY) {
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize().scale(150);
    this.body.setVelocity(away.x, away.y);
    this.stunUntil = this.scene.time.now + 450;
  }

  update(time, player) {
    if (!this.active || !player || player.isDead || time < this.stunUntil) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    let tx; let ty;
    // Rats are crowd-biters: with a goal they run for it and mostly ignore Gob,
    // so holding the line is about intercepting them, not just surviving.
    const range = this.goal ? this.snapRange : Infinity;
    if (dist < range) { tx = player.x; ty = player.y; } else { tx = this.goal.x; ty = this.goal.y; }
    // scurry: a little zig-zag so they're harder to line up
    const v = new Phaser.Math.Vector2(tx - this.x, ty - this.y).normalize();
    const wobble = Math.sin(time / 120 + this.x) * 0.45;
    this.body.setVelocity((v.x - v.y * wobble) * this.speed, (v.y + v.x * wobble) * this.speed);
    this.setFlipX(this.body.velocity.x < 0);
  }
}
