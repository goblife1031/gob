// AREA 5 (part 1) — THE S TOWER: lobby and climb. Per the Lore Book: the
// S Corp lobby (every dead screen flickering "VALUE YOU CAN HOLD"), Gob's
// reflection in the black glass with his eyes the brightest thing in the
// room, one of Rugg's coins glowing on the first stair ("Rugg coin. Up
// here?"), then the elevator's dead so it's the stairs: FLOOR 88, FLOOR 99
// and ROOF ACCESS, each a locked-door gauntlet that uses everything Gob has
// learned. The top door opens onto the roof (RoofScene).

const A5_COLS = 20;
const A5_ROWS = 50;
const A5_DOOR_ROWS = [38, 26, 13, 3];        // lobby->88, 88->99, 99->roof access, roof access->roof
const A5_FLOORS = [
  null,                                      // 0: lobby (no fight)
  { name: 'FLOOR 88', top: 27, bottom: 37, enemies: [['drone', 9, 30], ['rat', 4, 31], ['rat', 15, 31], ['garg', 10, 28]] },
  { name: 'FLOOR 99', top: 14, bottom: 25, enemies: [['garg', 9, 16], ['drone', 5, 18], ['drone', 14, 18], ['slime', 10, 22]] },
  { name: 'ROOF ACCESS', top: 4, bottom: 12, enemies: [['rat', 6, 7], ['rat', 13, 7], ['garg', 9, 5], ['drone', 10, 10]] },
];

class TowerClimbScene extends AreaScene {
  constructor() {
    super('TowerClimbScene');
  }

  create() {
    this.initArea();
    ['hasSword', 'hasDash', 'hasCharge'].forEach((k) => this.registry.set(k, true));
    // reset run-time state (Phaser reuses this object on restart)
    // a5Floor = the next floor to fight (checkpoint); 0 = haven't left the lobby
    this.nextFloor = Math.max(1, this.registry.get('a5Floor') || 0);
    this.checkpoint = this.registry.get('a5Floor') || 0;
    this.floorStarted = false;
    this.beats = { reflection: this.checkpoint > 0, coin: this.checkpoint > 0 };
    // Gob catches his breath at the tower door: the finale starts at full hearts
    if (this.checkpoint === 0) this.registry.set('hp', this.registry.get('maxHp'));
    this.doors = [];

    const W = A5_COLS * TILE;
    const H = A5_ROWS * TILE;
    this.cameras.main.setBackgroundColor('#08060e');
    this.buildMap();
    this.buildScreens();
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    // restart just south of the door into the floor Gob was fighting
    const startY = this.checkpoint === 0 ? 47 * TILE : (A5_DOOR_ROWS[this.checkpoint - 1] + 1) * TILE + 12;
    this.player = new Player(this, W / 2, startY);
    this.player.direction = 'up';
    this.physics.add.collider(this.player, this.layer);

    this.buildPickups();
    this.buildShots();
    this.buildEnemies();
    this.buildDoors();
    this.buildCoin();
    this.buildExit();

    this.finishArea('AREA 5', 'THE S TOWER', { think: this.checkpoint === 0 ? 'Big lobby. Nobody home.' : 'Door locked. Clear the floor.' });
  }

  // ---------- world ----------

  buildMap() {
    const data = [];
    for (let y = 0; y < A5_ROWS; y++) {
      const row = [];
      for (let x = 0; x < A5_COLS; x++) {
        let t;
        if (y < 3) t = T.TOWER;
        else if (A5_DOOR_ROWS.includes(y)) t = (x === 9 || x === 10) ? T.MARBLE : T.GLASS;
        else if (y === A5_ROWS - 1) t = T.TOWER;
        else if (x <= 1 || x >= 18) t = T.TOWER;
        else t = T.MARBLE;
        row.push(t);
      }
      data.push(row);
    }
    const put = (cells, t) => cells.forEach(([x, y]) => { data[y][x] = t; });
    // lobby: reception desk, dead elevators in the back wall
    put([[3, 44], [4, 44], [5, 44], [6, 44]], T.DESK);   // reception desk, off to the side
    put([[13, 38], [14, 38]], T.ELEV);
    // FLOOR 88: cubicles
    put([[4, 29], [5, 29], [14, 29], [15, 29], [4, 33], [5, 33], [14, 33], [15, 33], [8, 35], [11, 35]], T.DESK);
    // FLOOR 99: server racks
    put([[3, 16], [3, 17], [16, 16], [16, 17], [7, 20], [12, 20], [3, 22], [16, 22]], T.RACK);
    // roof access: a few crates of S Corp junk
    put([[4, 8], [15, 8]], T.CRATE);
    this.buildTilemap(data, [2, 3, T.TOWER, T.GLASS, T.ELEV, T.DESK, T.RACK, T.CRATE]);
  }

  buildScreens() {
    // the slogan, flickering on the dead screens of the lobby's back wall
    const y = A5_DOOR_ROWS[0] * TILE - 16;
    [[4.5, 'S CORP'], [15.5, 'S CORP']].forEach(([cx, txt]) => {
      const t = this.add.text(cx * TILE, y, `${txt}\nVALUE YOU CAN HOLD`, {
        fontFamily: 'monospace', fontSize: '9px', color: '#4de1ff', align: 'center',
        backgroundColor: '#0a1e28', padding: { x: 4, y: 3 },
      }).setOrigin(0.5).setDepth(3);
      this.tweens.add({ targets: t, alpha: { from: 1, to: 0.35 }, duration: 120, yoyo: true, repeat: -1, repeatDelay: Phaser.Math.Between(700, 2200) });
    });
    this.add.text(13.5 * TILE + 16, A5_DOOR_ROWS[0] * TILE + 4, 'OUT OF ORDER', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ff6688', backgroundColor: '#1a0e2a',
    }).setOrigin(0.5).setDepth(4);
    // floor signs above each stairwell door
    ['FLOOR 88', 'FLOOR 99', 'ROOF ACCESS', 'ROOF'].forEach((name, i) => {
      this.add.text(10 * TILE, A5_DOOR_ROWS[i] * TILE - 10, name, {
        fontFamily: 'monospace', fontSize: '9px', color: '#eee7f8', backgroundColor: '#1a0e2acc', padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(7);
    });
  }

  buildDoors() {
    A5_DOOR_ROWS.forEach((row, i) => {
      const open = i < this.checkpoint;   // doors below the checkpoint floor are already open
      const d = this.physics.add.staticImage(10 * TILE, row * TILE + 16, 'floor_door', open ? 1 : 0).setDepth(6);
      if (open) { d.body.enable = false; d.setAlpha(0.35); }
      this.physics.add.collider(this.player, d);
      this.doors.push(d);
    });
  }

  openDoor(i) {
    const d = this.doors[i];
    if (!d || !d.body.enable) return;
    d.setFrame(1);
    this.cameras.main.shake(120, 0.004);
    this.time.delayedCall(250, () => { d.body.enable = false; this.tweens.add({ targets: d, alpha: 0.35, duration: 300 }); });
  }

  // ---------- lobby beats ----------

  buildCoin() {
    this.coin = null;
    if (this.beats.coin) return;
    this.coin = this.physics.add.staticImage(10 * TILE, (A5_DOOR_ROWS[0] + 1) * TILE + 12, 'coin_shot').setTint(0x96ffaa).setDepth(5);
    const glow = this.add.circle(this.coin.x, this.coin.y, 10, 0x5ad678, 0.25).setDepth(4);
    this.tweens.add({ targets: glow, scale: 1.6, alpha: 0.05, duration: 700, yoyo: true, repeat: -1 });
    this.coinGlow = glow;
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.beats.coin || !this.beats.reflection) return;
      this.beats.coin = true;
      this.coin.destroy(); this.coinGlow.destroy();
      this.playDialogue([
        { who: null, text: 'One of Rugg\'s "dragon-proof" coins, glowing faintly green.' },
        { who: 'Gob', text: 'Rugg coin. Up here?' },
      ], () => {
        this.openDoor(0);
        this.think('Elevator dead. Stairs.');
      });
    });
  }

  reflectionBeat() {
    this.beats.reflection = true;
    const p = this.player;
    p.frozen = true;
    p.direction = 'up';
    // Gob's reflection in the black glass: a dark shape, two bright eyes
    // on the glass panel beside the door (not behind it), Gob's dark shape with two bright eyes
    const gx = p.x <= 320 ? 7 * TILE + 16 : 12 * TILE + 16;
    const gy = A5_DOOR_ROWS[0] * TILE + 14;
    const ref = this.add.sprite(gx, gy, 'gob', 0).setTint(0x3a3058).setAlpha(0).setDepth(8);
    const glowL = this.add.circle(gx - 6, gy - 9, 5, 0x96ffaa, 0).setDepth(9);
    const glowR = this.add.circle(gx + 6, gy - 9, 5, 0x96ffaa, 0).setDepth(9);
    const eyeL = this.add.rectangle(gx - 6, gy - 9, 3, 3, 0xd8ffe0).setAlpha(0).setDepth(10);
    const eyeR = this.add.rectangle(gx + 6, gy - 9, 3, 3, 0xd8ffe0).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: ref, alpha: 0.85, duration: 700 });
    this.tweens.add({ targets: [eyeL, eyeR], alpha: 1, duration: 700, delay: 500 });
    this.tweens.add({ targets: [glowL, glowR], fillAlpha: 0.45, duration: 700, delay: 500 });
    this.time.delayedCall(1300, () => {
      this.playDialogue([
        { who: null, text: 'In the black glass, Gob catches his reflection. In the dark, his eyes are the brightest thing in the room.' },
        { who: 'Gob', text: '...' },
      ], () => {
        this.tweens.add({ targets: [ref, eyeL, eyeR, glowL, glowR], alpha: 0, duration: 600, onComplete: () => [ref, eyeL, eyeR, glowL, glowR].forEach((o) => o.destroy()) });
        this.think('Something glowing on the stairs...');
      });
    });
  }

  // ---------- floors ----------

  buildEnemies() {
    this.enemies = this.physics.add.group();
    this.physics.add.collider(this.enemies, this.layer, null, (e) => !(e instanceof Drone));
    this.physics.add.collider(this.enemies, this.enemies, null, (a, b) => !(a instanceof Drone) && !(b instanceof Drone));
    this.physics.add.collider(this.player, this.enemies, (player, e) => {
      if (player.isDashing) return;
      player.takeDamage(1, e.x, e.y);
      e.recoil(player.x, player.y);
    });
    this.physics.add.overlap(this.player.attackHitbox, this.enemies, (hb, e) => {
      if (!this.player.isAttacking) return;
      const charged = this.player.strikeCharged;
      if (e.takeHit(this.player.swingId, this.player.x, this.player.y, charged ? 3 : 1, charged)) {
        this.splat(e.x, e.y, 0x5ad678);
        this.maybeDropHeart(e.x, e.y, 0.3);
      }
    });
  }

  startFloor(i) {
    this.floorStarted = true;
    this.registry.set('a5Floor', i);          // checkpoint: die here, restart at this floor
    const f = A5_FLOORS[i];
    this.showAreaBanner('THE S TOWER', f.name);
    f.enemies.forEach(([kind, cx, cy]) => {
      const x = cx * TILE + 16; const y = cy * TILE + 16;
      let e;
      if (kind === 'garg') { e = new Gargoyle(this, x, y, false); e.stunUntil = this.time.now + 900; }
      else if (kind === 'drone') e = new Drone(this, x, y);
      else if (kind === 'rat') { e = new Rat(this, x, y); e.emerge(); }
      else { e = new Slime(this, x, y); e.emerge(); }
      this.enemies.add(e);
    });
    this.wakeAt = this.time.now + 1300;   // let the floor banner land before anything attacks
    this.think(i === 3 ? 'Wind. Roof close.' : i === 1 ? 'Door locked. Things in the way.' : '');
  }

  doorOpen(i) { return this.doors[i] && !this.doors[i].body.enable; }

  updateFloors() {
    const py = this.player.y;
    const n = this.nextFloor;
    if (!this.floorStarted && n <= 3 && this.doorOpen(n - 1) && py < A5_DOOR_ROWS[n - 1] * TILE) this.startFloor(n);
    if (this.floorStarted && this.enemies.countActive(true) === 0) {
      this.floorStarted = false;
      this.openDoor(n);
      this.nextFloor = n + 1;
      this.think(n < 3 ? 'Door open. Up.' : 'Roof.');
    }
  }

  buildExit() {
    const zone = this.add.zone(10 * TILE, A5_DOOR_ROWS[3] * TILE + 4, 2 * TILE, 10);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.player.isDead || this.doors[3].body.enable) return;
      GameState.goTo(this, 'RoofScene');
    });
  }

  update(time) {
    if (!this.player.isDead) this.player.update();
    if (time > (this.wakeAt || 0)) this.enemies.getChildren().forEach((e) => e.update(time, this.player));
    if (!this.beats.reflection && this.player.y < 42 * TILE) this.reflectionBeat();
    this.updateFloors();
    this.updateHud();
  }
}
