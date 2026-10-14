// Corrupted vending machine. Bolted down, doesn't move; when Gob is in range
// and in sight it glows (the tell) and spits a can at him. Cans can be
// swatted out of the air with the sword or dashed through. 3 hits to wreck.
class VendingMachine extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'vending', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.body.setSize(28, 44).setOffset(2, 2);
    this.setDepth(8);
    this.hp = 3;
    this.lastSwingId = -1;
    this.nextShotAt = 0;
  }

  takeHit(swingId) {
    if (swingId === this.lastSwingId) return false;
    this.lastSwingId = swingId;
    this.hp -= 1;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(90, () => this.active && this.clearTint());
    this.scene.tweens.add({ targets: this, x: this.x + 2, duration: 40, yoyo: true, repeat: 2 });
    if (this.hp <= 0) { this.destroy(); return true; }
    return false;
  }

  update(time, player, scene) {
    if (!this.active || !player || player.isDead || time < this.nextShotAt) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > 190 || !scene.lineOfSight(this.x, this.y + 8, player.x, player.y)) return;
    this.nextShotAt = time + 1900;
    this.setFrame(1);
    scene.time.delayedCall(380, () => {
      if (!this.active) return;
      this.setFrame(0);
      scene.fireShot(this.x, this.y + 14, player.x, player.y);
    });
  }
}
