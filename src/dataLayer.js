import analytics from './analytics';
import sampleConfig from './config.sample.json';

const chrome = window.chrome || {};
const jQuery = window.jQuery || {};

let cache = null;
let settingsLoadTime = 0;
let settingsChangeTime = 0;

const DEFAULT_STORAGE_OBJECT = {
  source: 'DIRECT',
  url: 'http://_url_to_your_config_file.json',
  configFile: JSON.stringify(sampleConfig, null, 2),
};

function openSettingsPage() {
  chrome.tabs.create({
    index: 0,
    url: 'src/settings.html',
  });
}

async function reload() {
  settingsLoadTime = new Date().getTime();
  const discSettings = await readSettingsFromDisc();
  let didSettingsChange = false;
  if (JSON.stringify(discSettings) !== JSON.stringify(cache)) {
    didSettingsChange = true;
    cache = discSettings;
  }
  if (cache.source === 'URL') {
    const configFile = await loadConfigFileFromUrl(cache.url);
    if (isValidConfigFile(configFile) && configFile !== cache.configFile) {
      cache.configFile = configFile;
      didSettingsChange = true;
      saveToDisc(cache);
    }
  }
  if (didSettingsChange) {
    settingsChangeTime = new Date().getTime();
  }
  return didSettingsChange;
}

function saveToDisc(storage) {
  chrome.storage.sync.set(storage);
}

async function loadConfigFileFromUrl(url) {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: url,
      dataType: 'text',
      cache: false,
      success: res => {
        resolve(res);
      },
      error: function() {
        reject(new Error('request failed'));
      },
      complete: function() {},
    });
  });
}

function readSettingsFromDisc() {
  return new Promise(resolve => {
    chrome.storage.managed.get(null, managedStorage => {
      if (!jQuery.isEmptyObject(managedStorage)) {
        console.log('Read settings from managed storage api');
        resolve({ ...managedStorage });
      } else {
        console.log('Read settings from disc');
        chrome.storage.sync.get(null, allStorage => {
          if (jQuery.isEmptyObject(allStorage)) {
            // This is the first use of the plugin
            analytics.install();
            openSettingsPage();
            resolve({ ...DEFAULT_STORAGE_OBJECT });
          } else {
            resolve({ ...allStorage });
          }
        });
      }
    });
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

function getConfig() {
  return { ...JSON.parse(cache.configFile) };
}

function getSettingsLoadTime() {
  return settingsLoadTime;
}

function getSettingsChangeTime() {
  return settingsChangeTime;
}

function isRemoteLoadingEnabled() {
  return cache.source === 'URL';
}

export default {
  reload,
  getConfig,
  getSettingsLoadTime,
  getSettingsChangeTime,
  isRemoteLoadingEnabled,
};
