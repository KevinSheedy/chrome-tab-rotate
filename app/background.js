console.log("started daemon: background.js");

// Global Session Object
var session = newSessionObject();

loadSettings().then(function(){

	ga('send', 'pageview', '/background.js');

	initEventListeners();

	if(session.config.autoStart == true) {
		play();
	}
});

function newSessionObject() {

	return {
		tabs: [],
		tabReloadTime: [],
		enableRotate: false,
		rotationCounter: 0,
		maxRotations: 5,
		nextIndex: 0,
		timerId: null,
		settingsLoadTime: 0,
		playStartTime: 0,
		analyticsCounter: 0,
		storageObject: {},
		config: {}
	}
}

function initEventListeners() {

		chrome.browserAction.onClicked.addListener(iconClicked);
}

function iconClicked() {
	if(session.enableRotate) {
		pause();
	} else {
		play();
	}
}

function play() {

	// Google Analytics
	ga('send', {
		hitType: 'event',
		eventCategory: 'user-action',
		eventAction: 'play',
		eventLabel: 'play'
	});

	
	chrome.browserAction.setIcon({path: "app/img/Pause-38.png"});
	chrome.browserAction.setTitle({"title": "Pause Tab Rotate"});
	session = newSessionObject();
	session.enableRotate = true;
	session.playStartTime = (new Date()).getTime();
	session.analyticsCounter = 0;
	loadSettings().then(beginCycling);
}

function pause() {

	// Google Analytics
	ga('send', {
		hitType: 'event',
		eventCategory: 'user-action',
		eventAction: 'pause',
		eventLabel: 'pause'
	});

	chrome.browserAction.setIcon({path: "app/img/Play-38.png"});
	chrome.browserAction.setTitle({"title": "Start Tab Rotate"});
	clearTimeout(session.timerId);
	session.enableRotate = false;
}

function loadSettings() {

	return new Promise(function(resolve, reject) {

		loadSettingsFromDisc().then(function(){
			if(session.config.source == 'URL') {
				loadSettingsFromUrl().then(function() {
					resolve();
				})
			} else {
				resolve();
			}
		})
	})
}

function loadSettingsFromDisc() {

	return new Promise(function(resolve, reject) {

		console.log("Read settings from disc");
		chrome.storage.sync.get(null, function(allStorage) {

			if(jQuery.isEmptyObject(allStorage)) {
				// This is the first use of the plugin
				analyticsReportInstallation();
				openSettingsPage();
				loadDefaultSettings().then(function(defaultSettings) {
					session.config = defaultSettings;
					resolve();
				});
			}
			else {
				session.storageObject = allStorage;
				session.config = parseSettings(allStorage);
				resolve();
			}
		});
	})
}

function loadSettingsFromUrl() {

	return new Promise(function(resolve, reject) {

		session.settingsLoadTime = (new Date()).getTime();
		
		jQuery.ajax({
			url: session.config.url,
			dataType: "text",
			cache: false,
			success: function(res) {
				if(res == session.storageObject.configFile) {
					console.log("Settings changed: no");
					resolve();
					return;
				}
				else {
					console.log("Settings changed: yes");
				}
				if( validateConfigFile(res)) {
					console.log("Settings are valid");
					session.storageObject.configFile = res;
					session.config = parseSettings(session.storageObject);
					console.log("Write settings to disc");
					chrome.storage.sync.set(session.storageObject, function(){resolve()});
					return;
				} else {
					console.log("invalid settings file. Continuing with old settings");
					resolve();
				}
			},
			error: function() {
				resolve();
			},
			complete: function() {

			}
		});
	})

}

function openSettingsPage() {
	chrome.tabs.create({
			"index": 0,
			"url": "app/settings.html"
		}, function(tab) {

		});
}

function validateConfigFile(configFile) {
	try {
		JSON.parse(configFile);
	} catch (e) {
		return false;
	}
	return true;
}

function loadDefaultSettings() {

	return new Promise(function(resolve, reject) {
		createStorageObject()
			.then(function(storageObject) {
				resolve(parseSettings(storageObject));
			})
	})
}

function createStorageObject() {
	return new Promise(function(resolve, reject) {
		var storageObject = {
			source: "DIRECT",
			url: "http://_url_to_your_config_file.json",
			configFile: ""
		}

		jQuery.get("/app/config.sample.json", null, function(text) {
			storageObject.configFile = text;
			resolve(jQuery.extend({}, storageObject));
		}, 'text')
	})
}

function beginCycling() {

		getTabsToClose()
			.then(insertTabs)
			.then(closeTabs)
			.then(rotateTabAndScheduleNextRotation);
}

function parseSettings(storageObject) {

	var config = JSON.parse(storageObject.configFile);

	config.source = storageObject.source;
	config.url = storageObject.url;
	return config;
}

function getTabsToClose() {

	return new Promise(function(resolve, reject) {
		var queryInactiveTabs = {
			"currentWindow": true
		}

		var tabIds = [];

		chrome.tabs.query(queryInactiveTabs, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {

				var tab = tabs[i];

				//if(!tab.url.startsWith("chrome:")) {
					tabIds.push(tabs[i].id);
				//}
			};

			resolve(tabIds);
		})
	})
}

function closeTabs(tabIds) {

	return new Promise(function(resolve, reject) {
		console.log("Fullscreen: " + session.config.fullscreen);

		if(session.config.fullscreen) {
			chrome.windows.getCurrent({}, function(window) {
				chrome.windows.update(window.id, {state: "fullscreen"});
			})
		}

		chrome.tabs.remove(tabIds, function() {

			resolve();
		})
	})
}


function insertTabs(tabIdsToClose) {

	return new Promise(function(resolve, reject) {

		var counter = 0;
		session.tabs = [];
		for(var i=0; i<session.config.websites.length; i++) {

			insertTab(session.config.websites[i].url, i, function(index, tab){
				session.tabs[index] = tab;
				session.tabReloadTime[index] = (new Date()).getTime();
				counter++;
				if(counter >= session.config.websites.length) {
					resolve(tabIdsToClose);
				}
			});

		}
	})	
}

function insertTab(url, indexOfTab, callback) {
	chrome.tabs.create({
			"index": indexOfTab,
			"url": url
		}, function(tab) {
			console.log("Inserted tabId: " + tab.id);
			
			callback(indexOfTab, tab);
		}
	);
}

function rotateTabAndScheduleNextRotation() {

	// Break out of infinite loop when pause is clicked
	if(!session.enableRotate)
		return;

	analyticsHeartbeat();

	if(session.nextIndex == 0 && isSettingsReloadRequired()) {
		loadSettings()
			.then(beginCycling);
		return;
	}

	if(session.rotationCounter++ >= session.maxRotations) {
		//return;
	}

	var currentTab = session.tabs[session.nextIndex];

	var sleepDuration = session.config.websites[session.nextIndex].duration;

	// Show the current tab
	console.log("Show tab: " + session.nextIndex);
	chrome.tabs.update(currentTab.id, {"active": true}, function() {});

	// Determine the next tab index
	if(++session.nextIndex >= session.tabs.length) {
		session.nextIndex = 0;
	}

	preloadTab(session.nextIndex);
	
	console.log("sleep for: " + sleepDuration);
	session.timerId = setTimeout(rotateTabAndScheduleNextRotation, sleepDuration * 1000);
}

function preloadTab(tabIndex) {

	if(!isTabReloadRequired(tabIndex)) {
		return;
	}

	// Preload the future tab in advance
	console.log("Preload tab: " + tabIndex);
	chrome.tabs.reload(session.tabs[tabIndex].id);
	session.tabReloadTime[tabIndex] = (new Date()).getTime();
}

function isSettingsReloadRequired() {
	var currentTimeMillis = (new Date()).getTime();
	var millisSinceLastReload = currentTimeMillis - session.settingsLoadTime;

	var reloadIntervalMillis = session.config.settingsReloadIntervalMinutes * 60 * 1000;

	if(millisSinceLastReload > reloadIntervalMillis && session.config.source == 'URL') {
		console.log("Reload settings from url: yes");
		return true;
	} else {
		console.log("Reload settings from url: no");
		return false;
	}
}

function isTabReloadRequired(tabIndex) {
	var currentTimeMillis = (new Date()).getTime();
	var millisSinceLastReload = currentTimeMillis - session.tabReloadTime[tabIndex];

	var reloadIntervalMillis = session.config.websites[tabIndex].tabReloadIntervalSeconds * 1000;

	if(reloadIntervalMillis <= 0) {
		return false;
	} else if(millisSinceLastReload > reloadIntervalMillis) {
		return true;
	} else {
		return false;
	}
}

function analyticsHeartbeat() {
	var ANALYTICS_INTERVAL_MILLIS = 60 * 60 * 1000;
	var nowMillis = (new Date()).getTime();
	var playDurationMillis = nowMillis - session.playStartTime;
	var nextAnalyticsSendTime = ANALYTICS_INTERVAL_MILLIS * (session.analyticsCounter + 1);

	if(playDurationMillis > nextAnalyticsSendTime) {

		console.log('analytics: heartbeat');
		session.analyticsCounter++;

		ga('send', {
			hitType: 'event',
			eventCategory: 'heartbeat',
			eventAction: 'heartbeat',
			eventLabel: 'heartbeat'
		});
	}
}

function analyticsReportInstallation() {

	console.log('analytics: install');

	// Google Analytics
	ga('send', {
		hitType: 'event',
		eventCategory: 'user-action',
		eventAction: 'install',
		eventLabel: 'install'
	});
}