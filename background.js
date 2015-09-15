document.addEventListener('DOMContentLoaded', function() {
	console.log("foo.js");
});


chrome.runtime.onMessage.addListener( function(request) {
	console.log("Got message:" + request.playPauseStatus);

	if(request.playPauseStatus == "PLAYING")
		play();
	else
		pause();
});

var model;
var gConfig;

function play() {

	loadSettingsFromDisc();
}

function pause() {
	g.enableRotate = false;
}

function loadSettingsFromDisc() {
	g = getDefaultGlobals();
	chrome.storage.sync.get(null, function(val) {
		if(!val.settings) {
			loadDefaultSettings();
			return;
		}
		else {
			model = val;

			applySettings();
		}
	});
}

function loadDefaultSettings() {

	model = {
		settingsSource: "DIRECT",
		settingsUrl: "http://<your_url>",
		settings: ""
	}

	jQuery.get("config.sample.js", function(res) {
		model.settings = res;

		applySettings();
	});
}

function applySettings() {
	gConfig = JSON.parse(model.settings);

	getTabsToClose();
}

console.log("background.js");

var gSettingsUrl;
var gConfig;

var g = getDefaultGlobals();

function getDefaultGlobals() {

	return {
		tabs: [],
		enableRotate: true,
		rotationCounter: 0,
		maxRotations: 5,
		nextIndex: 0
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

	chrome.tabs.remove(tabIds, function() {

		insertNextTab();
	})
}


function insertNextTab() {

	console.log("g.tabs.length:" + g.tabs.length);

	if(g.tabs.length >= gConfig.tabs.length) {
		rotateTab();
		return;
	}

	var url = gConfig.tabs[g.tabs.length].url;
	chrome.tabs.create({
			"index": g.tabs.length,
			"url": url
		}, function(tab) {
			console.log("Inserted tabId:" + tab.id);
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
	console.log("Current tab to show:" + g.nextIndex);

	var sleepDuration = gConfig.tabs[g.nextIndex].duration;

	// Show the current tab
	console.log("Show tabId:" + currentTab.id);
	chrome.tabs.update(currentTab.id, {"active": true}, function() {});

	// Determine the next tab index
	if(++g.nextIndex >= g.tabs.length) {
		g.nextIndex = 0;
	}
	console.log("Determined next tab to be:" + g.nextIndex);

	// Preload the future tab in advance
	console.log("Preload tab:" + g.nextIndex);
	chrome.tabs.reload(g.tabs[g.nextIndex].id);
	
	console.log("sleep for:" + sleepDuration);
	setTimeout(rotateTab, sleepDuration * 1000);
	
	//console.log("what next???");
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

	initTabs(gConfig.tabs);

	chrome.tabs.query({"currentWindow": true}, function(tabs){
		var tab = tabs[nextIndex];
		chrome.tabs.update(tab.id, {"active": true})
	})
}



