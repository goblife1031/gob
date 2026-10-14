// Brad's dev loophole. Off for players. Turn it on by opening the game with
// #dev in the URL, or by typing G-O-B-B while the game is paused. It is
// remembered in this browser until turned off the same way.
// While on, the pause menu shows a dev panel: jump to any area, god mode.
const Dev = {
  enabled: false,
  god: false,

  load() {
    try { this.enabled = localStorage.getItem('wog_dev') === '1'; } catch (e) { this.enabled = false; }
  },

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.god = false;
    try { localStorage.setItem('wog_dev', on ? '1' : '0'); } catch (e) { /* storage blocked: session only */ }
  },
};
Dev.load();
