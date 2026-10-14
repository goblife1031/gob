// End-of-build card for an area that isn't built yet. The previous area's
// exit lands here via GameState.goTo(scene, 'ComingSoonScene', {...}).
// SPACE replays the area just finished; R restarts from Area 1.
class ComingSoonScene extends Phaser.Scene {
  constructor() {
    super('ComingSoonScene');
  }

  create(data) {
    GameState.ensure(this.registry);
    this.cameras.main.setBackgroundColor('#0d0617');
    this.cameras.main.fadeIn(500, 13, 6, 23);

    const g = this.add.graphics();
    [[60, 120, 0xc850be], [180, 90, 0x7c3ac6], [430, 110, 0x4de1ff], [540, 80, 0x5ad678]].forEach(([x, y, c]) => {
      g.lineStyle(3, c, 0.7).strokeRect(x, y, 70, 34);
      g.fillStyle(c, 0.12).fillRect(x, y, 70, 34);
    });

    this.add.text(320, 196, data.kicker || '', { fontFamily: 'monospace', fontSize: '12px', color: '#5ad678' }).setOrigin(0.5);
    this.add.text(320, 222, data.name || '', { fontFamily: 'monospace', fontSize: '24px', color: '#b07ce6' })
      .setOrigin(0.5).setShadow(0, 0, '#7c3ac6', 10, true, true);
    this.add.text(320, 270, data.blurb || '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#eee7f8', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
    const p = this.add.text(320, 345, `SPACE: replay ${data.replayLabel || 'area'}   ·   R: start over from Area 1`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#5ad678',
    }).setOrigin(0.5);
    this.tweens.add({ targets: p, alpha: 0.3, duration: 650, yoyo: true, repeat: -1 });

    this.time.delayedCall(500, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        Object.entries(data.replayState || {}).forEach(([k, v]) => this.registry.set(k, v));
        this.registry.set('hp', this.registry.get('maxHp'));
        GameState.goTo(this, data.replayKey || 'BasementRowScene');
      });
      this.input.keyboard.once('keydown-R', () => {
        GameState.init(this.registry);
        GameState.goTo(this, 'BasementRowScene');
      });
    });
    window.__wogScene = this;
  }
}
