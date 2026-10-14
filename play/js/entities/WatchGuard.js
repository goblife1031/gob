// The Watch — Mintport's city guards. In Area 2 they think Gob is one of the
// monsters. Gob can't (and shouldn't) hurt them: a sword hit just clangs off
// and gets him spotted. Each guard patrols a horizontal beat and sees along
// the cone of its lantern light; crates and stalls block that line of sight.
// Being spotted gets Gob hauled back to the last checkpoint, no damage.
class WatchGuard extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, minX, maxX, facing = 1) {
    super(scene, x, y, 'watch', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 31 / 48);   // 48px art: body sits where the old 32px one did
    this.body.setSize(18, 16).setOffset(15, 29);
    this.body.setImmovable(true);
    this.setDepth(9);

    this.home = { x, facing };
    this.minX = minX;
    this.maxX = maxX;
    this.facing = facing;
    this.speed = 55;
    this.range = 120;
    this.halfAngle = Phaser.Math.DegToRad(30);
    this.pauseUntil = 0;
    this.cone = scene.add.graphics().setDepth(4);
    this.anims.play('watch_walk');
  }

  reset() {
    this.setPosition(this.home.x, this.y);
    this.facing = this.home.facing;
    this.pauseUntil = 0;
  }

  holdStill(ms) {
    this.pauseUntil = Math.max(this.pauseUntil, this.scene.time.now + ms);
  }

  update(time) {
    this.setFlipX(this.facing < 0);
    if (time < this.pauseUntil) {
      this.body.setVelocity(0, 0);
      this.anims.pause();
    } else {
      this.anims.resume();
      this.body.setVelocity(this.facing * this.speed, 0);
      if ((this.facing > 0 && this.x >= this.maxX) || (this.facing < 0 && this.x <= this.minX)) {
        this.body.setVelocity(0, 0);
        this.facing *= -1;
        this.pauseUntil = time + 1000; // look around at the end of the beat
      }
    }
    this.drawCone();
  }

  drawCone() {
    const a0 = this.facing > 0 ? 0 : Math.PI;
    this.cone.clear();
    this.cone.fillStyle(0xffdc78, this.alerted ? 0.32 : 0.13);
    this.cone.slice(this.x, this.y, this.range, a0 - this.halfAngle, a0 + this.halfAngle, false);
    this.cone.fillPath();
  }

  canSee(target, scene) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 26) return true;                 // bumped right into him
    if (dist > this.range) return false;
    const a0 = this.facing > 0 ? 0 : Math.PI;
    const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - a0));
    if (diff > this.halfAngle) return false;
    return scene.lineOfSight(this.x, this.y, target.x, target.y);
  }

  destroy(fromScene) {
    if (this.cone) this.cone.destroy();
    super.destroy(fromScene);
  }
}
