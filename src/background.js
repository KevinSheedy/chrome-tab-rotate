import analytics from './analytics';
import dataLayer from './dataLayer';

const { chrome } = globalThis;

let session = newSessionObject();

async function init() {
  await dataLayer.reload();
  session.config = dataLayer.getConfig();
  analytics.backgroundPageview();

  initEventListeners();

  if (session.config.autoStart) play();
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
  if (session.isRotateEnabled) {
    pause();
  } else {
    play();
  }
}

async function play() {
  analytics.play();

  chrome.browserAction.setIcon({ path: 'img/Pause-38.png' });
  chrome.browserAction.setTitle({ title: 'Pause Tab Rotate' });
  session = newSessionObject();
  session.isRotateEnabled = true;
  session.playStartTime = new Date().getTime();
  beginCycle(true);
}

function pause() {
  analytics.pause();

  chrome.browserAction.setIcon({ path: 'img/Play-38.png' });
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
  console.log(`Show tab: ${session.nextIndex}`);
  chrome.tabs.update(currentTab.id, { active: true });

  // Determine the next tab index
  session.nextIndex += 1;
  if (session.nextIndex >= session.tabs.length) {
    session.nextIndex = 0;
  }
  preloadTab(session.nextIndex, isFirstCycle);

  console.log(`sleep for: ${sleepDuration}`);

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
  const { closeExistingTabs } = session?.config;

  // New config option: closeExistingTabs
  // Default is false
  // But don't change behaviour for existing users how haven't set this option yet
  if (closeExistingTabs === undefined || closeExistingTabs === true) {
    await closeTabs(tabIdsToClose);
  }
}

async function getTabsToClose() {
  return new Promise((resolve) => {
    const queryInactiveTabs = {
      currentWindow: true,
    };

    const tabIds = [];

    chrome.tabs.query(queryInactiveTabs, (tabs) => {
      for (let i = 0; i < tabs.length; i += 1) {
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
  return new Promise((resolve) => {
    console.log(`Fullscreen: ${session.config.fullscreen}`);

    if (session.config.fullscreen) {
      chrome.windows.getCurrent({}, (window) => {
        chrome.windows.update(window.id, { state: 'fullscreen' });
      });
    }

    chrome.tabs.remove(tabIds, () => {
      resolve();
    });
  });
}

function insertTabs(tabIdsToClose) {
  return new Promise((resolve) => {
    let counter = 0;
    session.tabs = [];
    for (let i = 0; i < session.config.websites.length; i += 1) {
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

      /* eslint-disable */
      insertTab(url, i, (index, tab) => {
        session.tabs[index] = tab;
        session.tabReloadTime[index] = reloadTime;
        counter++;
        if (counter >= session.config.websites.length) {
          resolve(tabIdsToClose);
        }
      });
      /* eslint-enable */
    }
  });
}

function insertTab(url, indexOfTab, callback) {
  chrome.tabs.create(
    {
      index: indexOfTab,
      url,
    },
    (tab) => {
      console.log(`Inserted tabId: ${tab.id}`);

      callback(indexOfTab, tab);
    },
  );
}

function preloadTab(tabIndex, isFirstCycle) {
  if (!isTabReloadRequired(tabIndex) && !isFirstCycle) {
    console.log(`Do not Preload tab: ${tabIndex}`);
    return;
  }

  const { url } = session.config.websites[tabIndex];
  const { id } = session.tabs[tabIndex];

  console.log(`Preload tab: ${tabIndex}`);

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
  }
  console.log('Reload settings from url: no');
  return false;
}

function isTabReloadRequired(tabIndex) {
  const currentTimeMillis = new Date().getTime();
  const millisSinceLastReload =
    currentTimeMillis - session.tabReloadTime[tabIndex];

  const reloadIntervalMillis =
    session.config.websites[tabIndex].tabReloadIntervalSeconds * 1000;

  if (reloadIntervalMillis <= 0) {
    return false;
  }
  if (millisSinceLastReload > reloadIntervalMillis) {
    return true;
  }
  return false;
}
