// Reusable bottom-of-screen dialogue box. Freezes the player while open;
// SPACE / ENTER / click advances. Each line is { who, text } -- `who` of
// null renders as a system/item message (green, centered); `note: true`
// renders as one of Gob's MENTAL NOTES (his thoughts, not spoken aloud).
class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.open = false;
    const depth = 500;
    this.bg = scene.add.rectangle(320, 404, 600, 104, 0x1a0e2a, 0.95)
      .setStrokeStyle(2, 0x7c3ac6).setScrollFactor(0).setDepth(depth).setVisible(false);
    this.name = scene.add.text(34, 360, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#4de1ff', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(depth + 1).setVisible(false);
    this.body = scene.add.text(34, 380, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#eee7f8',
      wordWrap: { width: 572 }, lineSpacing: 6,
    }).setScrollFactor(0).setDepth(depth + 1).setVisible(false);
    this.prompt = scene.add.text(604, 444, '▸', {
      fontFamily: 'monospace', fontSize: '13px', color: '#5ad678',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(depth + 1).setVisible(false);
    scene.tweens.add({ targets: this.prompt, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    this._advance = () => this.advance();
    scene.input.keyboard.on('keydown-SPACE', this._advance);
    scene.input.keyboard.on('keydown-ENTER', this._advance);
    scene.input.on('pointerdown', this._advance);
    scene.events.once('shutdown', () => {
      scene.input.keyboard.off('keydown-SPACE', this._advance);
      scene.input.keyboard.off('keydown-ENTER', this._advance);
      scene.input.off('pointerdown', this._advance);
    });
  }

  show(lines, onDone) {
    this.lines = lines;
    this.index = 0;
    this.onDone = onDone;
    this.open = true;
    this.openedAt = this.scene.time.now;
    [this.bg, this.name, this.body, this.prompt].forEach((o) => o.setVisible(true));
    this.render();
  }

  render() {
    const line = this.lines[this.index];
    if (line.onShow) line.onShow();
    if (line.note) {
      this.name.setText('MENTAL NOTE').setColor('#5ad678').setVisible(true);
      this.body.setColor('#9fe8b0').setText(line.text).setX(34).setOrigin(0, 0).setAlign('left');
    } else if (line.who) {
      this.name.setColor('#4de1ff');
      this.name.setText(line.who.toUpperCase()).setVisible(true);
      this.body.setColor('#eee7f8').setText(line.text).setX(34).setOrigin(0, 0).setAlign('left');
    } else {
      this.name.setVisible(false);
      this.body.setColor('#5ad678').setText(line.text).setX(320).setOrigin(0.5, 0).setAlign('center');
    }
  }

  advance() {
    // ignore the same keypress that opened the box
    if (!this.open || this.scene.time.now - this.openedAt < 120) return;
    this.index += 1;
    if (this.index < this.lines.length) {
      this.render();
      return;
    }
    this.open = false;
    [this.bg, this.name, this.body, this.prompt].forEach((o) => o.setVisible(false));
    const done = this.onDone;
    this.onDone = null;
    if (done) done();
  }
}
