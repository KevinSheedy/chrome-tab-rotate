console.log("started daemon: background.js");
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

var state = resetGlobals();

function play() {

	loadSettingsFromDisc();
}

function pause() {
	clearTimeout(state.timerId);
	state.enableRotate = false;
}

function loadSettingsFromDisc() {

	// Should we do this here??
	state = resetGlobals();

	console.log("Read settings from disc");
	chrome.storage.sync.get(null, function(discSettings) {

		if(jQuery.isEmptyObject(discSettings)) {
			loadDefaultSettings();
			return;
		}
		else {
			state.settings = discSettings;
			state.config = parseSettings(discSettings);

			beginCycling();
		}
	});
}

function reloadSettingsFromUrl() {

	state.settingsLoadTime = (new Date()).getTime();
	
	jQuery.ajax({
		url: state.config.url,
		dataType: "text",
		success: function(res) {
			if(res == state.settings.configFile) {
				console.log("Settings unchanged");
			}
			else {
				console.log("Settings changed");
			}
			if( validateConfigFile(res)) {
				console.log("Settings are valid");
				state.settings.configFile = res;
				state.config = parseSettings(state.settings);
				console.log("Write settings to disc");
				chrome.storage.sync.set(state.settings, beginCycling);
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

	var settings = getDefaultSettings();

	state.config = parseSettings(settings);

	beginCycling();
}

var getDefaultSettings = (function() {

	var DEFAULT_CONFIG = {
		source: "DIRECT",
		url: "http://_url_to_your_config_file.json",
		configFile: ""
	}

	jQuery.get("/app/config.sample.json", function(res) {
		DEFAULT_CONFIG.configFile = res;
	})

	return function() {
		return jQuery.extend({}, DEFAULT_CONFIG);
	}
})();

function resetGlobals() {

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

function beginCycling() {

	// Reload Settings from URL
	if(isReloadRequired()) {
		reloadSettingsFromUrl();
	} else {
		getTabsToClose();
	}
}

function parseSettings(settings) {

	var config = JSON.parse(settings.configFile);

	config.url = settings.url;
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

	console.log("Fullscreen: " + state.config.fullscreen);

	if(state.config.fullscreen) {
		chrome.windows.getCurrent({}, function(window) {
			chrome.windows.update(window.id, {state: "fullscreen"});
		})
	}


	chrome.tabs.remove(tabIds, function() {

		state.tabs = [];
		insertNextTab();
	})
}


function insertNextTab() {

	if(state.tabs.length >= state.config.websites.length) {
		rotateTab();
		return;
	}

	var url = state.config.websites[state.tabs.length].url;
	

	chrome.tabs.create({
			"index": state.tabs.length,
			"url": url
		}, function(tab) {
			console.log("Inserted tabId: " + tab.id);
			state.tabs.push(tab);
			insertNextTab();
		}
	);
}

function rotateTab() {

	// Break out of infinite loop when pause is clicked
	if(!state.enableRotate)
		return;

	if(state.nextIndex == 0 && isReloadRequired()) {
		beginCycling()
		return;
	}

	if(state.rotationCounter++ >= state.maxRotations) {
		//return;
	}

	var currentTab = state.tabs[state.nextIndex];

	var sleepDuration = state.config.websites[state.nextIndex].duration;

	// Show the current tab
	console.log("Show tab: " + state.nextIndex);
	chrome.tabs.update(currentTab.id, {"active": true}, function() {});

	// Determine the next tab index
	if(++state.nextIndex >= state.tabs.length) {
		state.nextIndex = 0;

	}

	// Preload the future tab in advance
	console.log("Preload tab: " + state.nextIndex);
	chrome.tabs.reload(state.tabs[state.nextIndex].id);
	
	console.log("sleep for: " + sleepDuration);
	state.timerId = setTimeout(rotateTab, sleepDuration * 1000);
	
	//console.log("what next???");
}

function isReloadRequired() {
	var currentTimeMillis = (new Date()).getTime();
	var millisSinceLastReload = currentTimeMillis - state.settingsLoadTime;

	var reloadIntervalMillis = state.config.reloadIntervalMinutes * 60 * 1000;

	if(millisSinceLastReload > reloadIntervalMillis && state.config.enableAutoReload) {
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

	initTabs(state.config.websites);

	chrome.tabs.query({"currentWindow": true}, function(tabs){
		var tab = tabs[nextIndex];
		chrome.tabs.update(tab.id, {"active": true})
	})
}



