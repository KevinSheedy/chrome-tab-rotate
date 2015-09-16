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





function play() {

	loadSettingsFromDisc();
}

function pause() {
	clearTimeout(g.timerId);
	g.enableRotate = false;
}

function loadSettingsFromDisc() {

	// Should we do this here??
	g = resetGlobals();

	chrome.storage.sync.get(null, function(settings) {


		if(jQuery.isEmptyObject(settings)) {
			loadDefaultSettings();
			return;
		}
		else {
			g.config = parseSettings(settings);

			applySettings();
		}
	});
}

function reloadSettingsFromUrl() {
	
	jQuery.ajax({
		url: g.config.url,
		dataType: "text",
		success: function(res) {

			g.settings.configFile = res;
			if(validateSettings(g.settings)) {
				g.config = parseSettings(g.settings);
				chrome.storage.sync.set(g.settings, play);
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

function validateSettings(settings) {
	try {
		JSON.parse(settings);
	} catch (e) {
		return false;
	}
	return true;
}

function loadDefaultSettings() {

	var settings = getDefaultSettings();

	g.config = parseSettings(settings);

	applySettings();
}

var getDefaultSettings = (function() {

	var DEFAULT_CONFIG = {
		source: "DIRECT",
		url: "http://<your_url>",
		configFile: ""
	}

	jQuery.get("config.sample.json", function(res) {
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


var g = resetGlobals();

function resetGlobals() {

	return {
		tabs: [],
		enableRotate: true,
		rotationCounter: 0,
		maxRotations: 5,
		nextIndex: 0,
		timerId: null,
		loadTime: (new Date()).getTime(),
		config: {}
	}
}




function start() {
	g.nextIndex = 0;
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

	console.log("Fullscreen: " + g.config.fullscreen);

	if(g.config.fullscreen) {
		chrome.windows.getCurrent({}, function(window) {
			chrome.windows.update(window.id, {state: "fullscreen"});
		})
	}


	chrome.tabs.remove(tabIds, function() {

		insertNextTab();
	})
}


function insertNextTab() {

	if(g.tabs.length >= g.config.websites.length) {
		rotateTab();
		return;
	}

	var url = g.config.websites[g.tabs.length].url;
	

	chrome.tabs.create({
			"index": g.tabs.length,
			"url": url
		}, function(tab) {
			console.log("Inserted tabId: " + tab.id);
			g.tabs.push(tab);
			insertNextTab();
		}
	);
}

function rotateTab() {

	console.log("rotateTab()");

	if(!g.enableRotate)
		return;

	if(g.rotationCounter++ >= g.maxRotations) {
		//return;
	}

	var currentTab = g.tabs[g.nextIndex];

	var sleepDuration = g.config.websites[g.nextIndex].duration;

	// Show the current tab
	console.log("Show tab:" + g.nextIndex);
	chrome.tabs.update(currentTab.id, {"active": true}, function() {});

	// Determine the next tab index
	if(++g.nextIndex >= g.tabs.length) {
		g.nextIndex = 0;
		if(isReloadRequired()) {
			console.log("reload required");
			reloadSettingsFromUrl();
			return;
		} else {
			console.log("reload not required");
		}

	}

	// Preload the future tab in advance
	console.log("Preload tab:" + g.nextIndex);
	chrome.tabs.reload(g.tabs[g.nextIndex].id);
	
	console.log("sleep for:" + sleepDuration);
	g.timerId = setTimeout(rotateTab, sleepDuration * 1000);
	
	//console.log("what next???");
}

function isReloadRequired() {
	var currentTimeMillis = (new Date()).getTime();
	var millisSinceLastReload = currentTimeMillis - g.loadTime;

	var reloadIntervalMillis = g.config.reloadIntervalMinutes * 60 * 1000;

	if(millisSinceLastReload > reloadIntervalMillis && g.config.enableAutoReload) {
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

	initTabs(g.config.websites);

	chrome.tabs.query({"currentWindow": true}, function(tabs){
		var tab = tabs[nextIndex];
		chrome.tabs.update(tab.id, {"active": true})
	})
}



