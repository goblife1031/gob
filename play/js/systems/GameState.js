// Run-wide state that has to survive moving between areas (Phaser scenes
// are torn down and rebuilt on every transition, so anything that should
// carry over -- hearts, the sword -- lives in the game registry instead).
// This is also the seam a real save system plugs into later: persist
// GameState.snapshot() and feed it back through GameState.restore().
const GameState = {
  defaults() {
    return {
      maxHp: 16, hp: 16, hasSword: false, hasDash: false, hasCharge: false,
      // per-area progress, so dying mid-area doesn't replay finished set pieces
      a1GooCleared: false, a3AtLine: false, a3LineHeld: false, a3RuggIntroSeen: false, a3RuggBeaten: false,
      a4Stage: 0, a4RingSeen: false, a4Container: false,
      a5Floor: 0, a5Phase: 1, a5IntroSeen: false, a5P2NoteSeen: false, swordBroken: false,
    };
  },

  init(registry) {
    const d = this.defaults();
    Object.keys(d).forEach((k) => registry.set(k, d[k]));
  },

  ensure(registry) {
    if (!registry.has('maxHp')) this.init(registry);
  },

  snapshot(registry) {
    const d = this.defaults();
    const out = {};
    Object.keys(d).forEach((k) => { out[k] = registry.get(k); });
    return out;
  },

  // Dev loophole: set up the abilities/hearts a player would have on
  // reaching `key`, so any area can be started cold. Used by the #area URL
  // shortcuts and the dev panel in the pause menu.
  devPrep(registry, key) {
    const order = ['BasementRowScene', 'NeonMarketScene', 'BridgeScene', 'TowerDistrictScene', 'TowerClimbScene', 'RoofScene', 'EndingScene'];
    const i = order.indexOf(key);
    this.init(registry);
    registry.set('hasSword', i >= 1);
    registry.set('hasDash', i >= 2);
    // 16 to start, +1 from Rugg (Area 3), +1 from the gargoyle gate (Area 4)
    const hearts = 16 + (i >= 3 ? 1 : 0) + (i >= 4 ? 1 : 0);
    registry.set('maxHp', hearts); registry.set('hp', hearts);
    registry.set('a4Container', i >= 4);
    registry.set('hasCharge', i >= 4);
  },

  // Area-to-area transition: fade out, swap scenes, the next scene fades in
  // on its own create(). Every area uses this, so new areas only need to
  // call GameState.goTo(this, 'NextSceneKey').
  goTo(scene, key, data) {
    if (scene._leaving) return;
    scene._leaving = true;
    scene.physics && scene.physics.world && scene.physics.pause();
    scene.cameras.main.fadeOut(400, 13, 6, 23);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
  },
};
