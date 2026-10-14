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
    this.add.rectangle(320, 450, 640, 60, 0x06040c, 0.72);

    const logo = (text, y, size, color, glow) => this.add.text(34, y, text, {
      fontFamily: '"Arial Black", Impact, sans-serif', fontSize: `${size}px`, color, fontStyle: 'bold',
    }).setShadow(0, 0, glow, 14, true, true).setAlpha(0);
    const l1 = logo('WRATH', 34, 54, '#b07ce6', '#7c3ac6');
    const l2 = logo('OF', 92, 26, '#eee7f8', '#7c3ac6');
    const l3 = logo('GOB', 112, 72, '#5ad678', '#2a8a46');
    const sub = this.add.text(38, 196, 'CHAPTER ONE', { fontFamily: 'monospace', fontSize: '13px', color: '#eee7f8' }).setAlpha(0);
    this.tweens.add({ targets: [l1, l2, l3, sub], alpha: 1, duration: 900, delay: (t, k, v, i) => 500 + i * 220 });

    Save.leaveArea();
    this.save = Save.read();
    this.leaving = false;
    this.confirming = false;
    const style = { fontFamily: 'monospace', fontSize: '13px', color: '#5ad678' };

    if (this.save && !this.save.complete) {
      // CONTINUE / NEW GAME menu
      this.options = [
        { label: `CONTINUE  -  ${Save.label(this.save)}`, act: () => this.continueGame() },
        { label: 'NEW GAME', act: () => this.askNewGame() },
      ];
      this.sel = 0;
      this.optTexts = this.options.map((o, i) => this.add.text(320, 432 + i * 20, o.label, style).setOrigin(0.5).setAlpha(0).setShadow(0, 0, '#000000', 4, true, true));
      this.tweens.add({ targets: this.optTexts, alpha: 1, duration: 700, delay: 1400 });
      this.drawMenu();
    } else {
      if (this.save && this.save.complete) {
        this.add.text(602, 18, 'CHAPTER ONE COMPLETE', { fontFamily: 'monospace', fontSize: '11px', color: '#ffdc78' })
          .setOrigin(1, 0).setShadow(0, 0, '#000000', 4, true, true);
      }
      this.options = null;
      this.prompt = this.add.text(320, 450, 'press SPACE to begin', style).setOrigin(0.5).setAlpha(0);
      this.time.delayedCall(1600, () => this.tweens.add({ targets: this.prompt, alpha: { from: 1, to: 0.25 }, duration: 700, yoyo: true, repeat: -1 }));
    }

    this.time.delayedCall(700, () => {
      const kb = this.input.keyboard;
      const move = (d) => { if (this.options && !this.confirming) { this.sel = (this.sel + d + this.options.length) % this.options.length; this.drawMenu(); } };
      kb.on('keydown-UP', () => move(-1)); kb.on('keydown-W', () => move(-1));
      kb.on('keydown-DOWN', () => move(1)); kb.on('keydown-S', () => move(1));
      kb.on('keydown-SPACE', () => this.confirm());
      kb.on('keydown-ENTER', () => this.confirm());
      kb.on('keydown-ESC', () => this.cancelNewGame());
      this.input.on('pointerdown', () => this.confirm());
    });
    window.__wogScene = this;
  }

  drawMenu() {
    this.optTexts.forEach((t, i) => {
      const on = i === this.sel;
      t.setText((on ? '> ' : '  ') + this.options[i].label + (on ? ' <' : '  '));
      t.setColor(on ? '#5ad678' : '#8f86a3');
    });
  }

  confirm() {
    if (this.leaving) return;
    if (this.confirming) { this.newGame(); return; }
    if (this.options) this.options[this.sel].act();
    else this.newGame();
  }

  askNewGame() {
    this.confirming = true;
    this.optTexts.forEach((t) => t.setVisible(false));
    this.confirmText = this.add.text(320, 442, 'Start over? Your saved progress will be replaced.\nSPACE  start over      ESC  go back', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffdc78', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
  }

  cancelNewGame() {
    if (!this.confirming || this.leaving) return;
    this.confirming = false;
    this.confirmText.destroy();
    this.optTexts.forEach((t) => t.setVisible(true));
  }

  leave(fn) {
    this.leaving = true;
    this.cameras.main.fadeOut(700, 6, 4, 12);
    this.cameras.main.once('camerafadeoutcomplete', fn);
  }

  newGame() {
    Save.clear();
    GameState.init(this.registry);
    this.leave(() => this.scene.start('IntroScene'));
  }

  continueGame() {
    const key = Save.restore(this.registry);
    if (!key) { this.newGame(); return; }
    this.leave(() => this.scene.start(key));
  }
}
