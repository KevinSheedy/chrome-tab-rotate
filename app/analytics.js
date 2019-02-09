import manifest from '../manifest.json';
const { version } = manifest;
const ga = window.ga || (() => null);

const analytics = {
  startup: () =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'version',
      eventAction: 'manifest',
      eventLabel: manifest.version,
    }),
  play: () =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'user-action',
      eventAction: 'play',
      eventLabel: manifest.version,
    }),
  pause: () =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'user-action',
      eventAction: 'pause',
      eventLabel: manifest.version,
    }),
  heartbeat: action =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'heartbeat',
      eventAction: action,
      eventLabel: manifest.version,
    }),
  install: () =>
    ga('send', {
      hitType: 'event',
      eventCategory: 'user-action',
      eventAction: 'install',
      eventLabel: version,
    }),
};

export default analytics;
