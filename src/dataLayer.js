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
  const settings = await readSettingsFromDisc();
  console.log('settings', settings);
  if (settings.source === 'URL') {
    const remoteSettings = await loadSettingsFromUrl(settings.url);
    console.log('remoteSettings', remoteSettings);
  }
  //   .then(saveSettingsToCache)
  //   .then(loadSettingsFromUrlIfNecessary);
  // console.log('cache', cache);
}

async function loadSettingsFromUrl(url) {
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

export default { init };
