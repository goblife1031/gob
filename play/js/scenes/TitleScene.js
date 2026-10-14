// The title screen: Brad's painted cover art (the game's key art) full-screen,
// with the logo over it. This is the one place painted art is shown as-is;
// everything in gameplay stays pixel art (see the Art Spec doc).
class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // smooth filtering for the painting (the game default is pixel-sharp)
    this.textures.get('title_art').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const art = this.add.image(320, 240, 'title_art').setAlpha(0);
    this.tweens.add({ targets: art, alpha: 1, duration: 1200 });
    // slow push-in so the still image breathes
    this.tweens.add({ targets: art, scale: 1.04, duration: 14000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // darken the top-left where the logo sits, so it reads over the art
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x06040c, 0x06040c, 0x06040c, 0x06040c, 0.85, 0.0, 0.6, 0.0);
    shade.fillRect(0, 0, 420, 260);
    this.add.rectangle(320, 450, 640, 60, 0x06040c, 0.55);

    const logo = (text, y, size, color, glow) => this.add.text(34, y, text, {
      fontFamily: '"Arial Black", Impact, sans-serif', fontSize: `${size}px`, color, fontStyle: 'bold',
    }).setShadow(0, 0, glow, 14, true, true).setAlpha(0);
    const l1 = logo('WRATH', 34, 54, '#b07ce6', '#7c3ac6');
    const l2 = logo('OF', 92, 26, '#eee7f8', '#7c3ac6');
    const l3 = logo('GOB', 112, 72, '#5ad678', '#2a8a46');
    const sub = this.add.text(38, 196, 'CHAPTER ONE', { fontFamily: 'monospace', fontSize: '13px', color: '#eee7f8' }).setAlpha(0);
    this.tweens.add({ targets: [l1, l2, l3, sub], alpha: 1, duration: 900, delay: (t, k, v, i) => 500 + i * 220 });

    this.prompt = this.add.text(320, 450, 'press SPACE to begin', { fontFamily: 'monospace', fontSize: '13px', color: '#5ad678' })
      .setOrigin(0.5).setAlpha(0);
    this.time.delayedCall(1600, () => this.tweens.add({ targets: this.prompt, alpha: { from: 1, to: 0.25 }, duration: 700, yoyo: true, repeat: -1 }));

    this.leaving = false;
    const go = () => {
      if (this.leaving) return;
      this.leaving = true;
      this.cameras.main.fadeOut(700, 6, 4, 12);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('IntroScene'));
    };
    this.time.delayedCall(700, () => {
      this.input.keyboard.on('keydown-SPACE', go);
      this.input.keyboard.on('keydown-ENTER', go);
      this.input.on('pointerdown', go);
    });
    window.__wogScene = this;
  }
}
