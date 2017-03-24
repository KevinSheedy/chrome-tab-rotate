console.log("started daemon: background.js");

var session = newSessionObject();

function newSessionObject() {

	return {
		tabs: [],
		enableRotate: true,
		rotationCounter: 0,
		maxRotations: 5,
		nextIndex: 0,
		timerId: null,
		settingsLoadTime: 0,
		settings: {},
		config: {}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	console.log("DOM Loaded");
	console.log("Listening for commands...");

	chrome.runtime.onMessage.addListener( function(request) {
		console.log("Received Command: " + request.playPauseStatus);

		if(request.playPauseStatus == "PLAY")
			play();
		else
			pause();
	});
});

function play() {

	loadSettingsFromDisc();
}

function pause() {
	clearTimeout(session.timerId);
	session.enableRotate = false;
}

function loadSettingsFromDisc() {

	// Should we do this here??
	session = newSessionObject();

	console.log("Read settings from disc");
	chrome.storage.sync.get(null, function(allStorage) {

		if(jQuery.isEmptyObject(allStorage)) {
			loadDefaultSettings().then(function(defaultSettings) {
				session.config = defaultSettings;
				beginCycling();
			});
			return;
		}
		else {
			session.settings = allStorage;
			session.config = parseSettings(allStorage);

			beginCycling();
		}
	});
}

function reloadSettingsFromUrl() {

	session.settingsLoadTime = (new Date()).getTime();
	
	jQuery.ajax({
		url: session.config.url,
		dataType: "text",
		success: function(res) {
			if(res == session.settings.configFile) {
				console.log("Settings changed: no");
				beginCycling();
				return;
			}
			else {
				console.log("Settings changed: yes");
			}
			if( validateConfigFile(res)) {
				console.log("Settings are valid");
				session.settings.configFile = res;
				session.config = parseSettings(session.settings);
				console.log("Write settings to disc");
				chrome.storage.sync.set(session.settings, beginCycling);
				return;
			} else {
				console.log("invalid settings file. Continuing with old settings");
				beginCycling();
			}
		},
		error: function() {
			beginCycling();
		},
		complete: function() {

		}
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

		jQuery.get("/app/config.sample.json", function(res) {
			storageObject.configFile = res;
			resolve(jQuery.extend({}, storageObject));
		})
	})
}

function beginCycling() {

	// Reload Settings from URL
	if(isReloadRequired()) {
		reloadSettingsFromUrl();
	} else {
		getTabsToClose()
			.then(closeTabs)
			.then(insertNextTab);
	}
}

function parseSettings(storageObject) {

	var config = JSON.parse(storageObject.configFile);

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

				if(!tab.url.startsWith("chrome")) {
					tabIds.push(tabs[i].id);
				}
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
				chrome.windows.update(window.id, {session: "fullscreen"});
			})
		}

		chrome.tabs.remove(tabIds, function() {

			session.tabs = [];
			resolve();
		})
	})
}


function insertNextTab() {

	if(session.tabs.length >= session.config.websites.length) {
		rotateTab();
		return;
	}

	var url = session.config.websites[session.tabs.length].url;

	chrome.tabs.create({
			"index": session.tabs.length,
			"url": url
		}, function(tab) {
			console.log("Inserted tabId: " + tab.id);
			session.tabs.push(tab);
			insertNextTab();
		}
	);
}

function rotateTab() {

	// Break out of infinite loop when pause is clicked
	if(!session.enableRotate)
		return;

	if(session.nextIndex == 0 && isReloadRequired()) {
		beginCycling()
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

	// Preload the future tab in advance
	console.log("Preload tab: " + session.nextIndex);
	chrome.tabs.reload(session.tabs[session.nextIndex].id);
	
	console.log("sleep for: " + sleepDuration);
	session.timerId = setTimeout(rotateTab, sleepDuration * 1000);
	
	//console.log("what next???");
}

function isReloadRequired() {
	var currentTimeMillis = (new Date()).getTime();
	var millisSinceLastReload = currentTimeMillis - session.settingsLoadTime;

	var reloadIntervalMillis = session.config.settingsReloadIntervalMinutes * 60 * 1000;

	if(millisSinceLastReload > reloadIntervalMillis && session.config.readSettingsFromUrl) {
		console.log("Reload settings from url: yes");
		return true;
	} else {
		console.log("Reload settings from url: no");
		return false;
	}
}
