// Basic enemy — corruption that came alive (see the Lore Book). Wanders,
// then chases Gob within aggro range. PixelLab art (assets/sprites/slime.png,
// 5-frame 40x40 wobble, played back and forth).
class Slime extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'slime', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(22, 14).setOffset(9, 19);   // 40x40 PixelLab frame
    this.setDepth(9);

    this.hp = 2;
    this.speed = 45;
    this.aggroRange = 90;
    this.wanderTimer = 0;
    this.wanderDir = new Phaser.Math.Vector2(0, 0);
    this.stunUntil = 0;
    this.lastSwingId = -1;

    this.anims.play('slime_idle', true);
  }

  // Crawl up out of a gutter pool: grows in from nothing, harmless until done.
  emerge() {
    this.stunUntil = this.scene.time.now + 600;
    this.setScale(0.1).setAlpha(0.4);
    this.scene.tweens.add({ targets: this, scale: 1, alpha: 1, duration: 550, ease: 'Back.Out' });
    return this;
  }

  // Returns true if this hit killed it. swingId stops one swing (whose
  // hitbox overlaps for several frames) from counting as several hits.
  takeHit(swingId, fromX, fromY, dmg = 1) {
    if (swingId === this.lastSwingId) return false;
    this.lastSwingId = swingId;
    this.hp -= dmg;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => this.active && this.clearTint());
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize().scale(220);
    this.body.setVelocity(away.x, away.y);
    this.stunUntil = this.scene.time.now + 220;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  // Called after it bumps Gob: back off briefly so it can't pin him.
  recoil(fromX, fromY) {
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize().scale(120);
    this.body.setVelocity(away.x, away.y);
    this.stunUntil = this.scene.time.now + 700;
  }

  update(time, player) {
    if (!this.active || !player || player.isDead) return;
    if (time < this.stunUntil) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // in siege mode they're focused on the target and only lunge at Gob up close
    const aggro = this.goal ? 60 : this.aggroRange;
    if (dist < aggro) {
      const dir = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
      this.body.setVelocity(dir.x * this.speed, dir.y * this.speed);
    } else if (this.goal) {
      // siege mode (Area 3): crawl toward a target instead of wandering
      const g = new Phaser.Math.Vector2(this.goal.x - this.x, this.goal.y - this.y).normalize();
      this.body.setVelocity(g.x * this.speed * 0.8, g.y * this.speed * 0.8);
    } else {
      if (time > this.wanderTimer) {
        this.wanderTimer = time + Phaser.Math.Between(1000, 2500);
        const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
        this.wanderDir.set(Math.cos(angle), Math.sin(angle));
      }
      this.body.setVelocity(this.wanderDir.x * this.speed * 0.4, this.wanderDir.y * this.speed * 0.4);
    }
  }
}
