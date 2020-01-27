import analytics from './analytics';
import dataLayer from './dataLayer';

const chrome = window.chrome || {};

let session = newSessionObject();

async function init() {
  await dataLayer.reload();
  session.config = dataLayer.getConfig();
  analytics.backgroundPageview();

  initEventListeners();

  session.config.autoStart && play();
}
init();

function newSessionObject() {
  return {
    tabs: [],
    tabReloadTime: [],
    isRotateEnabled: false,
    nextIndex: 0,
    timerId: null,
    playStartTime: 0,
    config: {},
  };
}

function initEventListeners() {
  chrome.browserAction.onClicked.addListener(iconClicked);
}

function iconClicked() {
  session.isRotateEnabled ? pause() : play();
}

async function play() {
  analytics.play();

  chrome.browserAction.setIcon({ path: 'src/img/Pause-38.png' });
  chrome.browserAction.setTitle({ title: 'Pause Tab Rotate' });
  session = newSessionObject();
  session.isRotateEnabled = true;
  session.playStartTime = new Date().getTime();
  beginCycle(true);
}

function pause() {
  analytics.pause();

  chrome.browserAction.setIcon({ path: 'src/img/Play-38.png' });
  chrome.browserAction.setTitle({ title: 'Start Tab Rotate' });
  clearTimeout(session.timerId);
  session.isRotateEnabled = false;
}

async function beginCycle(isFirstCycle = false) {
  console.log('isFirstCycle', isFirstCycle);
  let didSettingsChange = false;
  if (isFirstCycle || isSettingsReloadRequired()) {
    console.log('session', session);
    didSettingsChange = await dataLayer.reload();
    session.config = dataLayer.getConfig();
    if (isFirstCycle || didSettingsChange) {
      await initTabs();
    }
  }
  rotateTabAndScheduleNextRotation(isFirstCycle || didSettingsChange);
}

async function rotateTabAndScheduleNextRotation(isFirstCycle) {
  // Break out of infinite loop when pause is clicked
  if (!session.isRotateEnabled) return;

  const { playStartTime } = session;
  analytics.analyticsHeartbeat(playStartTime);

  const currentTab = session.tabs[session.nextIndex];

  const sleepDuration = session.config.websites[session.nextIndex].duration;

  // Show the current tab
  console.log('Show tab: ' + session.nextIndex);
  chrome.tabs.update(currentTab.id, { active: true });

  // Determine the next tab index
  do {
    if (++session.nextIndex >= session.tabs.length) {
      session.nextIndex = 0;
    }
  } while (!checkTime(session.nextIndex));

  preloadTab(session.nextIndex, isFirstCycle);

  console.log('sleep for: ' + sleepDuration);

  session.timerId = setTimeout(
    session.nextIndex === 0
      ? beginCycle
      : () => rotateTabAndScheduleNextRotation(isFirstCycle),
    sleepDuration * 1000,
  );
}

async function initTabs() {
  const tabIdsToClose = await getTabsToClose();
  console.log('tabIdsToClose', tabIdsToClose);
  await insertTabs();
  await closeTabs(tabIdsToClose);
}

async function getTabsToClose() {
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
      let url = 'about:blank';
      let reloadTime = 0;
      const { lazyLoadTabs } = session.config;

      // Issue #27
      // Reduce cpu/memory usage on startup
      // Only load the first two web pages, then load subsequent pages one by one.
      if (!lazyLoadTabs || i < 2) {
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

function getLocalTimezoneOffsetISO8601() {
  var timezone_offset_min = new Date().getTimezoneOffset(),
  offset_hrs = parseInt(Math.abs(timezone_offset_min/60)),
  offset_min = Math.abs(timezone_offset_min%60),
  timezone_standard;

  if(offset_hrs < 10)
    offset_hrs = '0' + offset_hrs;

  if(offset_min < 10)
    offset_min = '0' + offset_min;

  // Add an opposite sign to the offset
  // If offset is 0, it means timezone is UTC
  if(timezone_offset_min < 0)
    timezone_standard = '+' + offset_hrs + ':' + offset_min;
  else if(timezone_offset_min > 0)
    timezone_standard = '-' + offset_hrs + ':' + offset_min;
  else if(timezone_offset_min == 0)
    timezone_standard = 'Z';

  // Timezone difference in hours and minutes
  // String such as +5:30 or -6:00 or Z
  return timezone_standard;
}

/*
 * This function determines if the current time is between the ones entered
 * in the config.json. If so it returns true, false otherwise. It also
 * returns true if there are no times set.
 */
function checkTime(tabIndex) {
  console.log("entering checkTime...");
  try {
    var fromTimeRaw = session.config.websites[tabIndex].showFromTime;
    var toTimeRaw = session.config.websites[tabIndex].showToTime;
  }
  catch (e) {
    console.log("entered catch and return true...");
    return true;
  }

  if (fromTimeRaw == null || toTimeRaw == null) {
    console.log("entered if and return true...");
    return true;
  }

  var d = new Date();
  var today = d.getFullYear() + "-" + d.getMonth()+1 + "-" + d.getDate();
  var fromTime = new Date(today + "T" + fromTimeRaw + getLocalTimezoneOffsetISO8601());
  var toTime = new Date(today + "T" + toTimeRaw + getLocalTimezoneOffsetISO8601());

  if (d.getTime() > fromTime.getTime() && d.getTime() < toTime.getTime()) {
    return true;
  } else {
    return false;
  }
}

function preloadTab(tabIndex, isFirstCycle) {
  if (!isTabReloadRequired(tabIndex) && !isFirstCycle) {
    console.log('Do not Preload tab: ' + tabIndex);
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
  const millisSinceLastReload =
    currentTimeMillis - dataLayer.getSettingsLoadTime();

  const reloadIntervalMillis =
    session.config.settingsReloadIntervalMinutes * 60 * 1000;

  console.log('currentTimeMillis', currentTimeMillis);
  console.log('millisSinceLastReload', millisSinceLastReload);
  console.log('reloadIntervalMillis', reloadIntervalMillis);

  if (
    dataLayer.isRemoteLoadingEnabled() &&
    millisSinceLastReload > reloadIntervalMillis
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
