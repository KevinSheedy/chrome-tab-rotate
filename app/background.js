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
			loadDefaultSettings();
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

	createStorageObject()
		.then(function(storageObject) {
			session.config = parseSettings(storageObject);
			beginCycling();
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
		getTabsToClose();
	}
}

function parseSettings(storageObject) {

	var config = JSON.parse(storageObject.configFile);

	config.url = storageObject.url;
	return config;
}

function getTabsToClose() {

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

		closeTabs(tabIds);
	})
	
}

function closeTabs(tabIds) {

	console.log("Fullscreen: " + session.config.fullscreen);

	if(session.config.fullscreen) {
		chrome.windows.getCurrent({}, function(window) {
			chrome.windows.update(window.id, {session: "fullscreen"});
		})
	}


	chrome.tabs.remove(tabIds, function() {

		session.tabs = [];
		insertNextTab();
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

function init(config) {
	console.log("# required tabs: " + config.tabs.length);

	initTabs(config.tabs);
}

function initTabs(requiredTabs) {

	for (var i = 0; i < requiredTabs.length; i++) {
		
		initTab(i, requiredTabs[i].url);
	};
}

function initTab(index, desiredUrl) {

	console.log("initTab:", [index, desiredUrl]);

	var queryInfo = {
		"currentWindow": true,
		"index": index
	}

	chrome.tabs.query(queryInfo, function(tabs) {
		console.log("found tab");
		var tab = tabs[0];
		if(tab && tab.url == desiredUrl)
			return;

		chrome.tabs.create({
			"index": index,
			"url": desiredUrl
		});
	});
}

var nextIndex = 0;

function wakeUp() {

	initTabs(session.config.websites);

	chrome.tabs.query({"currentWindow": true}, function(tabs){
		var tab = tabs[nextIndex];
		chrome.tabs.update(tab.id, {"active": true})
	})
}



