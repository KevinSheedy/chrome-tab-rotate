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

	chrome.storage.sync.get(null, function(settings) {


		if(jQuery.isEmptyObject(settings)) {
			loadDefaultSettings();
			return;
		}
		else {
			state.settings = settings;
			state.config = parseSettings(settings);

			applySettings();
		}
	});
}

function reloadSettingsFromUrl() {
	
	jQuery.ajax({
		url: state.config.url,
		dataType: "text",
		success: function(res) {

			if(validateConfigFile(res)) {
				state.settings.configFile = res;
				state.config = parseSettings(state.settings);
				chrome.storage.sync.set(state.settings, play);
				return;
			} else {
				console.log("invalid settings file. Continuing with old settings");
				play();
			}
		},
		error: function() {
			play();
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

	applySettings();
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

function applySettings() {

	getTabsToClose();
}

function parseSettings(settings) {

	var config = JSON.parse(settings.configFile);

	config.url = settings.url;
	return config;
}

function resetGlobals() {

	return {
		tabs: [],
		enableRotate: true,
		rotationCounter: 0,
		maxRotations: 5,
		nextIndex: 0,
		timerId: null,
		loadTime: (new Date()).getTime(),
		settings: {},
		config: {}
	}
}




function start() {
	state.nextIndex = 0;
	getTabsToClose();
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

	console.log("rotateTab()");

	if(!state.enableRotate)
		return;

	if(state.rotationCounter++ >= state.maxRotations) {
		//return;
	}

	var currentTab = state.tabs[state.nextIndex];

	var sleepDuration = state.config.websites[state.nextIndex].duration;

	// Show the current tab
	console.log("Show tab:" + state.nextIndex);
	chrome.tabs.update(currentTab.id, {"active": true}, function() {});

	// Determine the next tab index
	if(++state.nextIndex >= state.tabs.length) {
		state.nextIndex = 0;
		if(isReloadRequired()) {
			console.log("Reload settings from url: yes");
			reloadSettingsFromUrl();
			return;
		} else {
			console.log("Reload settings from url: no");
		}

	}

	// Preload the future tab in advance
	console.log("Preload tab:" + state.nextIndex);
	chrome.tabs.reload(state.tabs[state.nextIndex].id);
	
	console.log("sleep for:" + sleepDuration);
	state.timerId = setTimeout(rotateTab, sleepDuration * 1000);
	
	//console.log("what next???");
}

function isReloadRequired() {
	var currentTimeMillis = (new Date()).getTime();
	var millisSinceLastReload = currentTimeMillis - state.loadTime;

	var reloadIntervalMillis = state.config.reloadIntervalMinutes * 60 * 1000;

	if(millisSinceLastReload > reloadIntervalMillis && state.config.enableAutoReload) {
		return true;
	} else {
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



