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

async function init() {
  const foo = await readSettingsFromDisc();
  console.log('foo', foo);
  //   .then(saveSettingsToCache)
  //   .then(loadSettingsFromUrlIfNecessary);
  // console.log('cache', cache);
}

// function init() {}

function saveSettingsToCache(settings) {
  return new Promise(resolve => {
    cache = settings;
    resolve(settings);
  });
}
function loadSettingsFromUrlIfNecessary(settings) {
  return new Promise(resolve => {
    if (settings.source !== 'URL') {
      resolve(settings);
      return;
    }
    jQuery.ajax({
      url: settings.url,
      dataType: 'text',
      cache: false,
      success: res => {
        if (res === cache.configFile) {
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

export default { init };
