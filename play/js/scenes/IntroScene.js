// Opening story sequence, played once before Area 1 (Basement Row). Sets up the hook Brad
// locked in: Gob claws out of the basement he was locked in, his own crypto
// coin already collapsed, straight into a city under attack that needs him.
// Backdrops are drawn with plain Phaser Graphics (no new art assets) so this
// stays a quick drop-in now and a real-art swap later — just replace
// showPanel()'s bg() calls with images.
class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0617');
    this.transitioning = false;

    this.panels = [
      {
        art: 'intro_1', bg: (g) => this.drawBasement(g),
        lines: [
          'Three days underground. No signal. No light.',
          'Just Gob, a busted laptop, and a server rack humming itself to death.',
        ],
      },
      {
        art: 'intro_2', bg: (g) => this.drawCrashedChart(g),
        lines: [
          'Gob built his own coin once. Poured everything into it.',
          'He watched it crash to zero from this basement — then the power went too.',
        ],
      },
      {
        art: 'intro_3', bg: (g) => this.drawCracks(g),
        lines: [
          'Then the wall cracked open. Sickly green light poured through the gap.',
          'Gob dug himself out — straight into a city already under siege.',
        ],
      },
      {
        art: 'intro_4', bg: (g) => this.drawCitySkyline(g),
        lines: [
          'Mintport. The city that never sleeps — and tonight it is screaming.',
          'Gob squeezes through the crack and into the street. Broke. Doubted. Still standing.',
        ],
      },
    ];
    this.panelIndex = -1;

    this.bgGraphics = this.add.graphics();
    // framed story panel: 512x384 pixel art, shown through a 512x300 window
    // that slowly pans down the image (a comic panel with a little life)
    this.frame = this.add.rectangle(320, 170, 522, 310, 0x0d0617).setStrokeStyle(3, 0x7c3ac6);
    this.frameGlow = this.add.rectangle(320, 170, 530, 318).setStrokeStyle(1, 0x5ad678, 0.6);
    this.panelImg = this.add.image(64, 20, 'intro_1').setOrigin(0, 0);

    this.titleCard = this.add.text(320, 68, 'WRATH OF GOB', {
      fontFamily: 'monospace', fontSize: '22px', color: '#b07ce6',
    }).setOrigin(0.5).setAlpha(0);
    this.subTitle = this.add.text(320, 96, 'AREA 1 — BASEMENT ROW', {
      fontFamily: 'monospace', fontSize: '11px', color: '#5ad678',
    }).setOrigin(0.5).setAlpha(0);

    this.boxBg = this.add.rectangle(320, 398, 600, 120, 0x1a0e2a, 0.92)
      .setStrokeStyle(2, 0x7c3ac6);
    this.boxText = this.add.text(320, 390, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#eee7f8', align: 'center',
      wordWrap: { width: 570 }, lineSpacing: 5,
    }).setOrigin(0.5);
    this.prompt = this.add.text(320, 443, 'press SPACE ▸', {
      fontFamily: 'monospace', fontSize: '11px', color: '#5ad678',
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.prompt, alpha: 0.25, duration: 650, yoyo: true, repeat: -1 });

    this.showPanel(0);

    const advance = () => this.advance();
    this.input.keyboard.on('keydown-SPACE', advance);
    this.input.keyboard.on('keydown-ENTER', advance);
    this.input.on('pointerdown', advance);
  }

  showPanel(i) {
    this.panelIndex = i;
    const panel = this.panels[i];
    this.bgGraphics.clear();
    if (panel.art && this.textures.exists(panel.art)) {
      this.tweens.killTweensOf(this.panelPan || {});
      this.panelImg.setTexture(panel.art).setVisible(true).setAlpha(0);
      this.tweens.add({ targets: this.panelImg, alpha: 1, duration: 500 });
      // pan the 300px-tall window down the 384px panel over 9 seconds
      this.panelPan = { y: 0 };
      const apply = () => this.panelImg.setCrop(0, this.panelPan.y, 512, 300).setY(20 - this.panelPan.y);
      apply();
      this.tweens.add({ targets: this.panelPan, y: 84, duration: 9000, ease: 'Sine.InOut', onUpdate: apply });
    } else {
      this.panelImg.setVisible(false);
      panel.bg(this.bgGraphics);
    }
    this.boxText.setText(panel.lines.join('\n\n'));
    this.titleCard.setAlpha(0);   // the title screen shows the logo now
    this.subTitle.setAlpha(0);
  }

  advance() {
    if (this.transitioning) return;
    if (this.panelIndex < this.panels.length - 1) {
      this.showPanel(this.panelIndex + 1);
    } else {
      this.transitioning = true;
      this.cameras.main.fadeOut(450, 13, 6, 23);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('BasementRowScene'));
    }
  }

  drawBasement(g) {
    g.fillStyle(0x140a20, 1).fillRect(0, 0, 640, 480);
    g.fillStyle(0x0d0617, 1).fillRect(0, 300, 640, 180); // floor
    for (let x = 30; x < 640; x += 95) {
      g.fillStyle(0x1a0e2a, 1).fillRect(x, 70, 72, 230); // crate/pillar shapes
      g.lineStyle(1, 0x3a1860, 1).strokeRect(x, 70, 72, 230);
    }
    g.fillStyle(0x5ad678, 0.55).fillRect(296, 150, 10, 90); // dying server light strip
    g.fillStyle(0x5ad678, 0.2).fillRect(286, 150, 30, 90);
  }

  drawCrashedChart(g) {
    g.fillStyle(0x140a20, 1).fillRect(0, 0, 640, 480);
    g.lineStyle(1, 0x7c3ac6, 0.35);
    for (let y = 70; y < 440; y += 40) g.lineBetween(40, y, 600, y);
    const pts = [[60, 150], [140, 190], [220, 170], [300, 250], [380, 230], [460, 370], [540, 420]];
    g.lineStyle(4, 0xff6688, 1);
    for (let i = 0; i < pts.length - 1; i++) {
      g.lineBetween(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    }
    pts.forEach(([x, y]) => g.fillStyle(0xff6688, 1).fillCircle(x, y, 3));
  }

  drawCracks(g) {
    g.fillStyle(0x140a20, 1).fillRect(0, 0, 640, 480);
    g.lineStyle(6, 0x5ad678, 0.85);
    g.lineBetween(330, 0, 290, 130);
    g.lineBetween(290, 130, 350, 230);
    g.lineBetween(350, 230, 270, 330);
    g.lineBetween(270, 330, 320, 480);
    g.lineStyle(2, 0x5ad678, 0.4);
    g.lineBetween(290, 130, 210, 170);
    g.lineBetween(350, 230, 430, 270);
    g.lineBetween(270, 330, 200, 360);
    g.fillStyle(0x5ad678, 0.12).fillRect(0, 0, 640, 480);
  }

  drawCitySkyline(g) {
    g.fillStyle(0x0d0617, 1).fillRect(0, 0, 640, 480);
    const buildings = [
      [10, 280, 60, 200], [85, 220, 50, 260], [150, 300, 70, 180],
      [230, 180, 55, 300], [300, 260, 65, 220], [380, 200, 50, 280],
      [440, 320, 60, 160], [510, 240, 60, 240], [580, 290, 50, 190],
    ];
    buildings.forEach(([x, y, w, h]) => {
      g.fillStyle(0x1a0e2a, 1).fillRect(x, y, w, h);
      g.fillStyle(0x5ad678, 0.5);
      for (let wy = y + 10; wy < y + h - 10; wy += 20) {
        for (let wx = x + 8; wx < x + w - 8; wx += 16) g.fillRect(wx, wy, 6, 8);
      }
    });
    // the S Corp tower and its neon S, dead center: the game's compass
    g.fillStyle(0x140a22, 1).fillRect(296, 110, 48, 370);
    g.lineStyle(5, 0x4de1ff, 0.95);
    g.beginPath();
    g.arc(320, 136, 12, Phaser.Math.DegToRad(-20), Phaser.Math.DegToRad(270), true);
    g.strokePath();
    g.beginPath();
    g.arc(320, 160, 12, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(160), false);
    g.strokePath();
    g.fillStyle(0x5ad678, 0.3).fillRect(0, 440, 640, 40); // ground haze
    g.fillStyle(0x5ad678, 0.15).fillRect(0, 0, 640, 480); // sickly sky tint
  }
}
