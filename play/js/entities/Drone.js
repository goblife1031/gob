// Corrupted S Corp security drone. Flies over walls and carts, drifts toward
// Gob, and every couple of seconds lines up and dives at him. One hit kills.
class Drone extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'drone', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(18, 14).setOffset(15, 19);   // 48px art
    this.setDepth(12);
    this.hp = 1;
    this.lastSwingId = -1;
    this.stunUntil = 0;
    this.nextDiveAt = 0;
    this.diveUntil = 0;
    this.anims.play('drone_fly');
  }

  takeHit(swingId, fromX, fromY) {
    if (swingId === this.lastSwingId) return false;
    this.lastSwingId = swingId;
    this.hp -= 1;
    if (this.hp <= 0) { this.destroy(); return true; }
    return false;
  }

  recoil(fromX, fromY) {
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize().scale(160);
    this.body.setVelocity(away.x, away.y);
    this.stunUntil = this.scene.time.now + 700;
    this.diveUntil = 0;
  }

  update(time, player) {
    if (!this.active || !player || player.isDead) return;
    if (time < this.stunUntil || time < this.diveUntil) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > 230) { this.body.setVelocity(0, Math.sin(time / 300) * 12); this.clearTint(); return; }
    const dir = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    if (dist < 150 && time > this.nextDiveAt) {
      // brief red "lock on" flash, then the dive
      this.setTint(0xff6666);
      this.body.setVelocity(0, 0);
      this.stunUntil = time + 350;
      this.scene.time.delayedCall(350, () => {
        if (!this.active) return;
        const d2 = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize().scale(190);
        this.body.setVelocity(d2.x, d2.y);
        this.diveUntil = this.scene.time.now + 480;
        this.clearTint();
      });
      this.nextDiveAt = time + 2600;
      return;
    }
    this.body.setVelocity(dir.x * 50, dir.y * 50 + Math.sin(time / 250) * 15);
  }
}
