// Corrupted gargoyle (Area 4's new enemy): a stone statue the green has
// taken over. Normal sword hits just clink off; only a CHARGED strike
// breaks it. Dormant ones are static (the first one blocks the street as
// the charged-swing lesson); awake ones hop at Gob and hurt on contact.
// Like everything corrupted, they freeze in Watch lantern light.
class Gargoyle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, dormant = false) {
    super(scene, x, y, 'gargoyle', dormant ? 0 : 1);
    scene.add.existing(this);
    scene.physics.add.existing(this, dormant);
    this.dormant = dormant;
    if (dormant) {
      this.refreshBody();
      this.body.setSize(46, 40, true);   // 48px art at normal scale (was 32px x1.6)
    } else {
      this.setCollideWorldBounds(true);
      this.setOrigin(0.5, 32 / 48);   // 48px art: body sits where the old 32px one did
      this.body.setSize(20, 16).setOffset(14, 30);
    }
    this.setDepth(9);
    this.hp = 3;
    this.lastSwingId = -1;
    this.stunUntil = 0;
    this.nextHopAt = scene.time.now + Phaser.Math.Between(600, 1400);
    this.hopUntil = 0;
  }

  // dmg is ignored unless the strike was charged
  takeHit(swingId, fromX, fromY, dmg = 1, charged = false) {
    if (swingId === this.lastSwingId) return false;
    this.lastSwingId = swingId;
    if (!charged) {
      this.scene.floatText(this.x, this.y - 24, 'clink!', '#c8c6d0');
      this.scene.tweens.add({ targets: this, x: this.x + 2, duration: 40, yoyo: true, repeat: 1 });
      return false;
    }
    this.hp -= dmg;
    if (this.hp <= 0) {
      for (let i = 0; i < 6; i++) this.scene.splat(this.x + Phaser.Math.Between(-16, 16), this.y + Phaser.Math.Between(-14, 14), 0x8a8896);
      this.destroy();
      return true;
    }
    return false;
  }

  recoil(fromX, fromY) {
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize().scale(120);
    if (!this.dormant) this.body.setVelocity(away.x, away.y);
    this.stunUntil = this.scene.time.now + 700;
  }

  update(time, player) {
    if (!this.active || this.dormant || !player || player.isDead) return;
    if (time < this.stunUntil) { this.body.setVelocity(0, 0); this.setFrame(1); return; }
    if (time < this.hopUntil) return;
    this.body.setVelocity(0, 0);
    this.setFrame(1);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const target = dist < 180 || !this.goal ? player : this.goal;   // otherwise hop toward the light
    if ((dist < 260 || this.goal) && time > this.nextHopAt) {
      const v = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y).normalize().scale(150);
      this.body.setVelocity(v.x, v.y);
      this.setFrame(2);
      this.hopUntil = time + 280;
      this.nextHopAt = time + 1250;
    }
  }
}
