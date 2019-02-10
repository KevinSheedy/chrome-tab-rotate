import analytics from './analytics';
import sampleConfig from './config.sample.json';

const chrome = window.chrome || {};
const jQuery = window.jQuery || {};

let session = newSessionObject();

loadSettings().then(() => {
  analytics.backgroundPageview();

  initEventListeners();

  session.config.autoStart && play();
});

function newSessionObject() {
  return {
    tabs: [],
    tabReloadTime: [],
    isRotateEnabled: false,
    rotationCounter: 0,
    nextIndex: 0,
    timerId: null,
    settingsLoadTime: 0,
    playStartTime: 0,
    analyticsCounter: 0,
    storageObject: {},
    config: {},
  };
}

function initEventListeners() {
  chrome.browserAction.onClicked.addListener(iconClicked);
}

function iconClicked() {
  session.isRotateEnabled ? pause() : play();
}

function play() {
  analytics.play();

  chrome.browserAction.setIcon({ path: 'src/img/Pause-38.png' });
  chrome.browserAction.setTitle({ title: 'Pause Tab Rotate' });
  session = newSessionObject();
  session.isRotateEnabled = true;
  session.playStartTime = new Date().getTime();
  session.analyticsCounter = 0;
  loadSettings().then(beginCycling);
}

function pause() {
  analytics.pause();

  chrome.browserAction.setIcon({ path: 'src/img/Play-38.png' });
  chrome.browserAction.setTitle({ title: 'Start Tab Rotate' });
  clearTimeout(session.timerId);
  session.isRotateEnabled = false;
}

function loadSettings() {
  return new Promise((resolve, reject) => {
    loadSettingsFromDisc().then(() => {
      if (session.config.source === 'URL') {
        loadSettingsFromUrl().then(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function loadSettingsFromDisc() {
  return new Promise((resolve, reject) => {
    console.log('Read settings from disc');
    chrome.storage.sync.get(null, allStorage => {
      if (jQuery.isEmptyObject(allStorage)) {
        // This is the first use of the plugin
        analytics.install();
        openSettingsPage();
        session.config = loadDefaultSettings();
        resolve();
      } else {
        session.storageObject = allStorage;
        session.config = parseSettings(allStorage);
        resolve();
      }
    });
  });
}

function loadSettingsFromUrl() {
  return new Promise((resolve, reject) => {
    session.settingsLoadTime = new Date().getTime();

    jQuery.ajax({
      url: session.config.url,
      dataType: 'text',
      cache: false,
      success: res => {
        if (res === session.storageObject.configFile) {
          console.log('Settings changed: no');
          resolve();
          return;
        } else {
          console.log('Settings changed: yes');
        }
        if (isValidConfigFile(res)) {
          console.log('Settings are valid');
          session.storageObject.configFile = res;
          session.config = parseSettings(session.storageObject);
          session.settingsChangeTime = new Date().getTime();
          console.log('Write settings to disc');
          chrome.storage.sync.set(session.storageObject, function() {
            resolve();
          });
        } else {
          console.log('invalid settings file. Continuing with old settings');
          resolve();
        }
      },
      error: function() {
        resolve();
      },
      complete: function() {},
    });
  });
}

function openSettingsPage() {
  chrome.tabs.create({
    index: 0,
    url: 'app/settings.html',
  });
}

function isValidConfigFile(configFile) {
  try {
    JSON.parse(configFile);
  } catch (e) {
    console.error('isValidConfigFile()', e);
    return false;
  }
  return true;
}

function loadDefaultSettings() {
  return parseSettings(createStorageObject());
}

function createStorageObject() {
  return {
    source: 'DIRECT',
    url: 'http://_url_to_your_config_file.json',
    configFile: JSON.stringify(sampleConfig, null, 2),
  };
}

function beginCycling() {
  if (
    session.settingsChangeTime &&
    session.settingsLoadTime > session.settingsChangeTime
  ) {
    rotateTabAndScheduleNextRotation();
    return;
  }

  getTabsToClose()
    .then(insertTabs)
    .then(closeTabs)
    .then(rotateTabAndScheduleNextRotation);
}

function parseSettings(storageObject) {
  const config = JSON.parse(storageObject.configFile);

  config.source = storageObject.source;
  config.url = storageObject.url;
  return config;
}

function getTabsToClose() {
  return new Promise((resolve, reject) => {
    const queryInactiveTabs = {
      currentWindow: true,
    };

    const tabIds = [];

    chrome.tabs.query(queryInactiveTabs, tabs => {
      for (let i = 0; i < tabs.length; i++) {
        // const tab = tabs[i];

        // if(!tab.url.startsWith("chrome:")) {
        tabIds.push(tabs[i].id);
        // }
      }

      resolve(tabIds);
    });
  });
}

function closeTabs(tabIds) {
  return new Promise((resolve, reject) => {
    console.log('Fullscreen: ' + session.config.fullscreen);

    if (session.config.fullscreen) {
      chrome.windows.getCurrent({}, window => {
        chrome.windows.update(window.id, { state: 'fullscreen' });
      });
    }

    chrome.tabs.remove(tabIds, () => {
      resolve();
    });
  });
}

function insertTabs(tabIdsToClose) {
  return new Promise((resolve, reject) => {
    let counter = 0;
    session.tabs = [];
    for (let i = 0; i < session.config.websites.length; i++) {
      let url = '';
      let reloadTime = 0;

      // Issue #27
      // Reduce cpu/memory usage on startup
      // Only load the first two web pages, then load subsequent pages one by one.
      if (i < 2) {
        url = session.config.websites[i].url;
        reloadTime = new Date().getTime();
      }
      insertTab(url, i, (index, tab) => {
        session.tabs[index] = tab;
        session.tabReloadTime[index] = reloadTime;
        counter++;
        if (counter >= session.config.websites.length) {
          resolve(tabIdsToClose);
        }
      });
    }
  });
}

function insertTab(url, indexOfTab, callback) {
  chrome.tabs.create(
    {
      index: indexOfTab,
      url: url,
    },
    tab => {
      console.log('Inserted tabId: ' + tab.id);

      callback(indexOfTab, tab);
    },
  );
}

function rotateTabAndScheduleNextRotation() {
  // Break out of infinite loop when pause is clicked
  if (!session.isRotateEnabled) return;

  const { playStartTime } = session;
  analytics.analyticsHeartbeat(playStartTime);

  if (session.nextIndex === 0 && isSettingsReloadRequired()) {
    loadSettings().then(beginCycling);
    return;
  }

  const currentTab = session.tabs[session.nextIndex];

  const sleepDuration = session.config.websites[session.nextIndex].duration;

  // Show the current tab
  console.log('Show tab: ' + session.nextIndex);
  chrome.tabs.update(currentTab.id, { active: true });

  // Determine the next tab index
  if (++session.nextIndex >= session.tabs.length) {
    session.nextIndex = 0;
  }

  preloadTab(session.nextIndex);

  console.log('sleep for: ' + sleepDuration);
  session.timerId = setTimeout(
    rotateTabAndScheduleNextRotation,
    sleepDuration * 1000,
  );
}

function preloadTab(tabIndex) {
  if (!isTabReloadRequired(tabIndex)) {
    return;
  }

  const { url } = session.config.websites[tabIndex];
  const { id } = session.tabs[tabIndex];

  console.log('Preload tab: ' + tabIndex);

  chrome.tabs.update(
    id,
    { url },
    // Issue 19 - Reset the url on reload - occasionally errors cause a redirect.
    () => chrome.tabs.update(id, { url }),
  );

  session.tabReloadTime[tabIndex] = new Date().getTime();
}

function isSettingsReloadRequired() {
  const currentTimeMillis = new Date().getTime();
  const millisSinceLastReload = currentTimeMillis - session.settingsLoadTime;

  const reloadIntervalMillis =
    session.config.settingsReloadIntervalMinutes * 60 * 1000;

  if (
    millisSinceLastReload > reloadIntervalMillis &&
    session.config.source === 'URL'
  ) {
    console.log('Reload settings from url: yes');
    return true;
  } else {
    console.log('Reload settings from url: no');
    return false;
  }
}

function isTabReloadRequired(tabIndex) {
  const currentTimeMillis = new Date().getTime();
  const millisSinceLastReload =
    currentTimeMillis - session.tabReloadTime[tabIndex];

  const reloadIntervalMillis =
    session.config.websites[tabIndex].tabReloadIntervalSeconds * 1000;

  if (reloadIntervalMillis <= 0) {
    return false;
  } else if (millisSinceLastReload > reloadIntervalMillis) {
    return true;
  } else {
    return false;
  }
}
