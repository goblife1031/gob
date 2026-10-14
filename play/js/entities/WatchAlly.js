// A member of the Watch fighting beside Gob (Area 4). Not a physics body:
// they walk the squad's route, hold positions, and carry the lanterns whose
// light pushes back the corruption fog and freezes corrupted creatures.
class WatchAlly extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture, name) {
    super(scene, x, y, texture, 0);
    scene.add.existing(this);
    this.setDepth(9);
    this.who = name;
    this.lightR = 92;         // lantern light radius (gutters to 0 at the tower)
    this.target = null;
    this.speed = 60;
    this.anims.play(texture === 'wick' ? 'wick_walk' : 'watch_walk');
    this.anims.pause();
  }

  get lanternX() { return this.x + (this.flipX ? -9 : 9); }
  get lanternY() { return this.y + 1; }   // where the lantern is in the 48px art

  moveTo(x, y) { this.target = { x, y }; }

  update(dt) {
    if (!this.target) { this.anims.pause(); return; }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) { this.setPosition(this.target.x, this.target.y); this.target = null; this.anims.pause(); return; }
    const step = Math.min(d, this.speed * dt / 1000);
    this.x += dx / d * step;
    this.y += dy / d * step;
    if (Math.abs(dx) > 1) this.setFlipX(dx < 0);
    this.anims.resume();
  }

  get arrived() { return !this.target; }
}
