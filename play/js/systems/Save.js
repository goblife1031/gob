// Autosave. Progress is kept in this browser (localStorage), one save slot.
// It saves when Gob enters an area and again whenever a story flag changes
// (sword picked up, line held, Rugg beaten, tower floor reached...), so
// Continue drops the player at the same checkpoint a death would.
// Hearts always come back full on Continue, same as a retry.
const SAVE_KEY = 'wog_save_v1';
const AREA_NAMES = {
  BasementRowScene: 'Area 1 - Basement Row',
  NeonMarketScene: 'Area 2 - Neon Market',
  BridgeScene: 'Area 3 - The Bridge',
  TowerDistrictScene: 'Area 4 - Tower District',
  TowerClimbScene: 'Area 5 - The S Tower',
  RoofScene: 'Area 5 - The Roof',
};

const Save = {
  area: null, // the area currently being played (null on title/intro/ending)
  registry: null,

  // called once from BootScene: watch the registry for story progress
  attach(registry) {
    this.registry = registry;
    registry.events.on('changedata', (parent, key) => {
      if (key !== 'hp' && this.area) this.write();
    });
  },

  enterArea(key) {
    if (!AREA_NAMES[key]) return;
    this.area = key;
    this.write();
  },

  leaveArea() { this.area = null; },

  write() {
    if (!this.area || !this.registry) return;
    const data = { v: 1, area: this.area, state: GameState.snapshot(this.registry), t: Date.now() };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked: no save */ }
  },

  read() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (d && (d.complete || AREA_NAMES[d.area])) return d;
    } catch (e) { /* corrupt or blocked */ }
    return null;
  },

  // Chapter One finished: the next Continue would only replay the ending,
  // so the slot just remembers the chapter was beaten.
  markComplete() {
    this.area = null;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, complete: true, t: Date.now() })); } catch (e) { /* ignore */ }
  },

  clear() {
    this.area = null;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  },

  // put the saved run back in the registry and return the scene to start
  restore(registry) {
    const d = this.read();
    if (!d || d.complete) return null;
    GameState.init(registry);
    Object.entries(d.state || {}).forEach(([k, v]) => { if (v !== undefined) registry.set(k, v); });
    registry.set('hp', registry.get('maxHp'));
    return d.area;
  },

  label(d) { return d && AREA_NAMES[d.area] ? AREA_NAMES[d.area] : ''; },
};
