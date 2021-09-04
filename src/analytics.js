import manifest from '../manifest.json';

const { version } = manifest;
console.log('started daemon: background.js');

const ga = (...args) => {
  if (globalThis?.ga) {
    globalThis?.ga(...args);
  } else {
    console.log('ga not available');
  }
};

const state = {
  lastHeartbeatTime: 0,
};

const analytics = {
  startup: () =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'version',
      eventAction: 'manifest',
      eventLabel: version,
    }),
  play: () =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'user-action',
      eventAction: 'play',
      eventLabel: version,
    }),
  pause: () =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'user-action',
      eventAction: 'pause',
      eventLabel: version,
    }),
  heartbeat: (action) => {
    console.log('analytics.heartbeat', action);
    ga('send', {
      hitType: 'event',
      eventCategory: 'heartbeat',
      eventAction: action,
      eventLabel: version,
    });
  },
  install: () => {
    console.log('analytics: install');
    ga('send', {
      hitType: 'event',
      eventCategory: 'user-action',
      eventAction: 'install',
      eventLabel: version,
    });
  },
  backgroundPageview: () => ga('send', 'pageview', '/background.js'),
  optionsPageview: () => ga('send', 'pageview', '/options.js'),
  analyticsHeartbeat(playStartTime) {
    console.log('analyticsHeartbeat');
    // All units in millis
    const now = new Date().getTime();
    const previous = state.lastHeartbeatTime || now;
    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;
    const uptime = now - playStartTime;

    const tenMinuteMark = playStartTime + 10 * MINUTE;
    const twentyMinuteMark = playStartTime + 20 * MINUTE;
    const thirtyMinuteMark = playStartTime + 30 * MINUTE;
    const fortyMinuteMark = playStartTime + 40 * MINUTE;
    const fiftyMinuteMark = playStartTime + 50 * MINUTE;
    const sixtyMinuteMark = playStartTime + 60 * MINUTE;

    if (previous < tenMinuteMark && tenMinuteMark < now)
      this.heartbeat('10mins');

    if (previous < twentyMinuteMark && twentyMinuteMark < now)
      this.heartbeat('20mins');

    if (previous < thirtyMinuteMark && thirtyMinuteMark < now)
      this.heartbeat('30mins');

    if (previous < fortyMinuteMark && fortyMinuteMark < now)
      this.heartbeat('40mins');

    if (previous < fiftyMinuteMark && fiftyMinuteMark < now)
      this.heartbeat('50mins');

    if (previous < sixtyMinuteMark && sixtyMinuteMark < now)
      this.heartbeat('60mins');

    const REALTIME_PULSE_INTERVAL = 3 * MINUTE;
    const lastPulseMark = now - (uptime % REALTIME_PULSE_INTERVAL);
    if (previous < lastPulseMark && lastPulseMark < now)
      this.heartbeat('pulse');

    const lastHourMark = now - (uptime % HOUR);
    if (previous < lastHourMark && lastHourMark < now) this.heartbeat('hour');

    const lastDayMark = now - (uptime % DAY);
    if (previous < lastDayMark && lastDayMark < now) this.heartbeat('day');

    const lastWeekMark = now - (uptime % WEEK);
    if (previous < lastWeekMark && lastWeekMark < now) this.heartbeat('week');

    const lastMonthMark = now - (uptime % MONTH);
    if (previous < lastMonthMark && lastMonthMark < now)
      this.heartbeat('month');

    const lastYearMark = now - (uptime % YEAR);
    if (previous < lastYearMark && lastYearMark < now) this.heartbeat('year');

    state.lastHeartbeatTime = now;
  },
};

analytics.startup();

export default analytics;
