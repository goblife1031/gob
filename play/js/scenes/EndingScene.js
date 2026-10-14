// THE ENDING (cinematic, no combat). Per the Lore Book: after the green
// flash Gob lies face down on the roof, his eyes fading from red back to
// green; Puc's sword lies in pieces beside him, the hilt still whole.
// Solgorath climbs wounded into the clouds: "That light should have unmade
// you. ...Interesting." The S sign goes dark. The Watch come up the stairs:
// "By the Holders... he's breathing." "Gob said... be back." A last mental
// note; Gob's hand closes around the hilt: "Gob build....." -> TO BE
// CONTINUED. Post-credits: Rugg on a distant rooftop, "He has the green eyes."
class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene');
  }

  create() {
    GameState.ensure(this.registry);
    Save.markComplete();
    window.__wogScene = this;
    const two = (key, tex, frames, rate) => {
      if (!this.anims.exists(key)) this.anims.create({ key, frames: frames.map((f) => ({ key: tex, frame: f })), frameRate: rate, repeat: -1 });
    };
    two('wick_walk', 'wick', [0, 1], 4);
    two('watch_walk', 'watch', [0, 1], 4);
    two('rugg_idle', 'rugg', [0, 1], 2);
    this.cameras.main.setBackgroundColor('#06040c');
    this.buildRoof();
    this.dialogue = new DialogueBox(this);
    this.phaseOne();
  }

  say(lines) {
    return new Promise((resolve) => this.dialogue.show(lines, resolve));
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  buildRoof() {
    const data = [];
    for (let y = 0; y < 15; y++) {
      const row = [];
      for (let x = 0; x < 20; x++) {
        if (y < 4) row.push(-1);
        else if (y === 4) row.push(T.LEDGE);
        else if (y === 14) row.push((x === 9 || x === 10) ? T.ROOF : T.TOWER);
        else if (x === 0 || x === 19) row.push(T.LEDGE);
        else row.push(T.ROOF);
      }
      data.push(row);
    }
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    map.createLayer(0, map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0), 0, 0);
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0x0b0514, 1).fillRect(0, 0, 640, 160);
    g.fillStyle(0x5ad678, 0.1).fillRect(0, 0, 640, 160);
    this.sSign = this.add.text(320, 40, 'S', {
      fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '76px', color: '#4de1ff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(-8).setShadow(0, 0, '#5ad678', 18, true, true);

    // the dragon, retreating (starts over the roof's edge)
    this.dragon = this.add.image(320, 90, 'solgorath', 2).setDepth(-5).setScale(0.9);   // frame 2: the cracked eye
    this.scar = this.add.circle(320, 82, 7, 0xd8ff6a, 0).setDepth(-4);   // (old placeholder scar, now drawn into the art)

    // Gob face down, eyes still red, and Puc's broken sword
    this.gob = this.add.image(300, 300, 'gob_down').setDepth(10);   // 48px art, lying on his side
    this.eye = this.add.rectangle(300 - 8, 300 - 3, 2, 3, 0xff4646).setDepth(11);
    this.eye2 = this.add.rectangle(300 - 8, 300 + 4, 2, 3, 0xff4646).setDepth(11);
    this.hilt = this.add.image(342, 312, 'sword_pieces', 0).setDepth(9).setScale(1.4);
    this.add.image(262, 326, 'sword_pieces', 1).setDepth(9).setScale(1.3).setAngle(40);
    this.add.image(378, 286, 'sword_pieces', 2).setDepth(9).setScale(1.3).setAngle(-25);

    this.white = this.add.rectangle(320, 240, 640, 480, 0xeaffd8, 1).setDepth(300);
    // what the flash left him: 3 hearts (the rest burned out, shown dark)
    const max = this.registry.get('maxHp') || 18;
    const hp = Math.min(this.registry.get('hp') || 3, 3);
    this.hud = [];
    for (let i = 0; i < max; i++) {
      this.hud.push(this.add.image(16 + (i % 10) * 17, 16 + Math.floor(i / 10) * 16, 'heart_pickup').setDepth(320).setTint(i < hp ? 0xffffff : 0x3a1a2a));
    }
    this.black = this.add.rectangle(320, 240, 640, 480, 0x000000, 0).setDepth(400);
  }

  async phaseOne() {
    // the light fades; ringing silence
    this.tweens.add({ targets: this.white, alpha: 0, duration: 2200 });
    await this.wait(2400);
    // his eyes fade from red back to green
    this.tweens.addCounter({
      from: 0, to: 100, duration: 1800,
      onUpdate: (tw) => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0xff4646), Phaser.Display.Color.ValueToColor(0x5ad678), 100, tw.getValue());
        this.eye.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        this.eye2.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
    });
    await this.say([
      { who: null, text: "When the light fades, Gob is face down on the roof. Puc's sword lies beside him, its blade in pieces, the hilt still whole." },
    ]);
    // Solgorath climbs, wounded, into the clouds; the S goes dark behind it
    this.tweens.add({ targets: [this.dragon], y: -120, scale: 0.5, alpha: 0.7, duration: 3200, ease: 'Sine.In' });
    this.tweens.add({ targets: [this.scar], y: -130, scale: 0.5, duration: 3200, ease: 'Sine.In' });
    await this.wait(900);
    await this.say([{ who: 'Solgorath (distant)', text: 'That light should have unmade you. ...Interesting.' }]);
    this.tweens.killTweensOf(this.sSign);
    this.tweens.add({ targets: this.sSign, alpha: { from: 1, to: 0.2 }, duration: 90, yoyo: true, repeat: 4,
      onComplete: () => this.sSign.setAlpha(0.08).setShadow(0, 0, '#000000', 0) });
    await this.wait(900);
    await this.say([{ who: null, text: 'The green light should have burned him to nothing. It didn\'t.' }]);
    await this.theWatch();
  }

  async theWatch() {
    // footsteps on the stairs; lantern light spills across the roof
    const glow = this.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    this.wick = this.add.sprite(304, 470, 'wick', 0).setDepth(10);
    this.tam = this.add.sprite(336, 476, 'watch', 0).setDepth(10).setFlipX(true);
    this.wick.anims.play('wick_walk'); this.tam.anims.play('watch_walk');
    const drawGlow = () => {
      glow.clear();
      [this.wick, this.tam].forEach((a) => {
        glow.fillStyle(0xffb347, 0.08).fillCircle(a.x, a.y, 80);
        glow.fillStyle(0xffdc78, 0.1).fillCircle(a.x, a.y, 44);
      });
    };
    this.events.on('update', drawGlow);
    this.tweens.add({ targets: this.wick, x: 296, y: 350, duration: 1800 });
    this.tweens.add({ targets: this.tam, x: 346, y: 356, duration: 1900 });
    await this.wait(2000);
    this.wick.anims.pause(); this.tam.anims.pause();
    await this.say([
      { who: 'Captain Wick', text: "Gob! ...Tam, he's breathing." },
      { who: 'Captain Wick', text: "By the Holders... he's breathing." },
      { who: 'Gob', text: 'Gob said... be back.' },
      { note: true, text: 'Sword broken. Puc said no second sword.' },
    ]);
    // Gob's hand closes around the hilt
    this.tweens.add({ targets: this.hilt, x: 322, y: 306, angle: -20, duration: 900, ease: 'Sine.Out' });
    await this.wait(1000);
    const glint = this.add.star(322, 302, 4, 2, 7, 0xffffff).setDepth(12);
    this.tweens.add({ targets: glint, alpha: 0, scale: 1.8, angle: 90, duration: 600, onComplete: () => glint.destroy() });
    await this.wait(500);
    await this.say([{ who: 'Gob', text: 'Gob build.....' }]);
    this.tweens.add({ targets: this.hud, alpha: 0, duration: 1600 });
    this.tweens.add({ targets: this.black, fillAlpha: 1, duration: 2200 });
    await this.wait(2600);
    this.events.off('update', drawGlow);
    // "Still standing": the last story panel, glowing faintly behind the card
    const still = this.add.image(320, 240, 'still_standing').setDepth(450).setAlpha(0);
    this.tweens.add({ targets: still, alpha: 0.55, duration: 2200 });
    this.stillPanel = still;
    const tbc = this.add.text(320, 240, 'TO BE CONTINUED', {
      fontFamily: 'monospace', fontSize: '26px', color: '#b07ce6',
    }).setOrigin(0.5).setDepth(500).setAlpha(0).setShadow(0, 0, '#7c3ac6', 12, true, true);
    this.tweens.add({ targets: tbc, alpha: 1, duration: 1500 });
    await this.wait(3800);
    this.tweens.add({ targets: [tbc, this.stillPanel], alpha: 0, duration: 1000 });
    await this.wait(1100);
    await this.credits();
  }

  async credits() {
    const lines = this.add.text(320, 240, 'WRATH OF GOB\nChapter One\n\nThanks for playing.', {
      fontFamily: 'monospace', fontSize: '16px', color: '#eee7f8', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setDepth(500).setAlpha(0);
    this.tweens.add({ targets: lines, alpha: 1, duration: 1200 });
    await this.wait(3600);
    this.tweens.add({ targets: lines, alpha: 0, duration: 1000 });
    await this.wait(1300);
    await this.postCredits();
  }

  async postCredits() {
    // a rooftop across the city
    this.children.list.filter((c) => c !== this.black && c.depth < 500 && c !== this.dialogue.bg && c !== this.dialogue.name && c !== this.dialogue.body && c !== this.dialogue.prompt).forEach((c) => c.setVisible(false));
    const g = this.add.graphics().setDepth(450);
    g.fillStyle(0x0b0514, 1).fillRect(0, 0, 640, 480);
    [[0, 260, 90], [80, 220, 70], [150, 280, 110], [420, 240, 80], [500, 200, 70], [570, 270, 70]].forEach(([x, y, w]) => g.fillStyle(0x140a22, 1).fillRect(x, y, w, 480 - y));
    g.fillStyle(0x24182e, 1).fillRect(240, 330, 180, 150);          // Rugg's rooftop
    g.fillStyle(0x4de1ff, 0.08).fillRect(300, 60, 40, 180);       // the dark S tower in the distance
    this.black.setDepth(600);
    const rugg = this.add.sprite(330, 312, 'rugg', 0).setDepth(460).setScale(1.1);
    rugg.anims.play('rugg_idle');
    const phone = this.add.rectangle(348, 300, 4, 7, 0x96ffaa).setDepth(461);
    this.tweens.add({ targets: phone, alpha: 0.5, duration: 400, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.black, fillAlpha: 0, duration: 1400 });
    await this.wait(1700);
    await this.say([
      { who: 'Rugg', text: 'Yeah, boss. The kid took the flash. Full blast. ...No. Still breathing.' },
      { who: 'Rugg', text: 'And boss? He has the green eyes.' },
    ]);
    this.tweens.add({ targets: this.black, fillAlpha: 1, duration: 2000 });
    await this.wait(2600);
    this.finalCard();
  }

  finalCard() {
    this.add.text(320, 220, 'WRATH OF GOB', {
      fontFamily: 'monospace', fontSize: '24px', color: '#b07ce6',
    }).setOrigin(0.5).setDepth(700).setShadow(0, 0, '#7c3ac6', 10, true, true);
    const p = this.add.text(320, 270, 'SPACE: play again from the start', {
      fontFamily: 'monospace', fontSize: '12px', color: '#5ad678',
    }).setOrigin(0.5).setDepth(700);
    this.tweens.add({ targets: p, alpha: 0.3, duration: 650, yoyo: true, repeat: -1 });
    this.finished = true;
    this.time.delayedCall(600, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        GameState.init(this.registry);
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
      });
    });
  }
}
