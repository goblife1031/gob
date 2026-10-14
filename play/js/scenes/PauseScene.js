// The ESC pause overlay. The area underneath is paused (physics, timers,
// tweens all stop) and resumes exactly where it was. Room to grow: options,
// volume, save/quit can slot in under the controls list later.
const DEV_JUMPS = [
  ['1', 'Area 1 - Basement Row', 'BasementRowScene'],
  ['2', 'Area 2 - Neon Market', 'NeonMarketScene'],
  ['3', 'Area 3 - The Bridge', 'BridgeScene'],
  ['4', 'Area 4 - Tower District', 'TowerDistrictScene'],
  ['5', 'Area 5 - The S Tower', 'TowerClimbScene'],
  ['6', 'Area 5 - The Roof', 'RoofScene'],
  ['7', 'Ending', 'EndingScene'],
];

class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(data) {
    this.from = data.from;
    this.typed = '';
    this.add.rectangle(320, 240, 640, 480, 0x0d0617, 0.88);
    this.add.text(320, 70, 'PAUSED', { fontFamily: 'monospace', fontSize: '26px', color: '#b07ce6' })
      .setOrigin(0.5).setShadow(0, 0, '#7c3ac6', 12, true, true);

    const r = this.registry;
    const controls = ['WASD / arrows   move', 'SPACE           talk / swing'];
    if (r.get('hasCharge')) controls.push('hold SPACE      charged swing');
    if (r.get('hasDash')) controls.push('SHIFT           dash');
    controls.push('ESC             pause');
    this.add.text(320, 105, controls.join('\n'), {
      fontFamily: 'monospace', fontSize: '12px', color: '#eee7f8', lineSpacing: 6,
    }).setOrigin(0.5, 0);

    this.add.text(320, 452, 'ESC or SPACE to resume', { fontFamily: 'monospace', fontSize: '12px', color: '#5ad678' }).setOrigin(0.5);

    this.devPanel = this.add.container(0, 0);
    this.buildDevPanel();

    this.input.keyboard.on('keydown', (e) => this.onKey(e));
  }

  buildDevPanel() {
    this.devPanel.removeAll(true);
    if (!Dev.enabled) return;
    const lines = DEV_JUMPS.map(([k, label]) => `${k}  ${label}`);
    lines.push('', `0  God mode: ${Dev.god ? 'ON' : 'off'}`, '9  Refill hearts', 'type GOBB  turn dev mode off');
    this.devPanel.add(this.add.rectangle(320, 334, 360, 212, 0x1a0e2a, 0.95).setStrokeStyle(1, 0xffdc78));
    this.devPanel.add(this.add.text(320, 232, 'DEV', { fontFamily: 'monospace', fontSize: '12px', color: '#ffdc78' }).setOrigin(0.5));
    this.devPanel.add(this.add.text(170, 246, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffdc78', lineSpacing: 3,
    }));
  }

  onKey(e) {
    // secret toggle: type GOBB while paused
    if (/^[a-z]$/i.test(e.key)) {
      this.typed = (this.typed + e.key.toUpperCase()).slice(-4);
      if (this.typed === 'GOBB') {
        Dev.setEnabled(!Dev.enabled);
        this.typed = '';
        this.cameras.main.flash(200, 255, 220, 120);
        this.buildDevPanel();
        return;
      }
    }
    if (e.key === 'Escape' || e.key === ' ') { this.resumeGame(); return; }
    if (!Dev.enabled) return;
    const jump = DEV_JUMPS.find(([k]) => k === e.key);
    if (jump) {
      GameState.devPrep(this.registry, jump[2]);
      this.scene.stop(this.from);
      this.scene.start(jump[2]);
      return;
    }
    if (e.key === '0') { Dev.god = !Dev.god; this.buildDevPanel(); }
    if (e.key === '9') {
      const area = this.scene.get(this.from);
      this.registry.set('hp', this.registry.get('maxHp'));
      if (area && area.player) area.player.setHp(area.player.maxHp);
      this.cameras.main.flash(150, 255, 102, 136);
    }
  }

  resumeGame() {
    this.scene.resume(this.from);
    this.scene.stop();
  }
}
