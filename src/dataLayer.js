// import 'regenerator-runtime/runtime';
import { path } from 'ramda';
import analytics from './analytics';
import sampleConfig from './config.sample.json';

console.log('path', path);

const chrome = window.chrome || {};
const jQuery = window.jQuery || {};

let cache = null;

const DEFAULT_STORAGE_OBJECT = {
  source: 'DIRECT',
  url: 'http://_url_to_your_config_file.json',
  configFile: JSON.stringify(sampleConfig, null, 2),
};

function openSettingsPage() {
  chrome.tabs.create({
    index: 0,
    url: 'app/settings.html',
  });
}

async function reload() {
  const discSettings = await readSettingsFromDisc();
  let didSettingsChange = false;
  if (JSON.stringify(discSettings) !== JSON.stringify(cache)) {
    didSettingsChange = true;
    cache = discSettings;
  }
  console.log('cache', cache);
  if (cache.source === 'URL') {
    const configFile = await loadConfigFileFromUrl(cache.url);
    console.log('configFile', configFile);
    if (isValidConfigFile(configFile) && configFile !== cache.configFile) {
      cache.configFile = configFile;
      didSettingsChange = true;
      saveToDisc(cache);
    }
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

export default { reload, getConfig };
