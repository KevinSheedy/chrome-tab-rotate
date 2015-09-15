console.log("background.js");

var gConfig;
var gSettingsTab;
var gTabs = [];
var gNumTabsInserted;
var gNextIndex = 0;
var gMaxRotations = 5;
var gRotationCounter = 0;
var gEnableRotate = false;

var queryInactiveTabs = {
	"currentWindow": true,
	"active": false
}

function start() {
	gEnableRotate = true;
	getTabsToClose();
}

function stop() {
	gEnableRotate = false;
}

function initEventHandlers() {

	jQuery("#start").click(start);
	jQuery("#stop").click(stop);
}

function getTabsToClose() {

	var tabIds = [];

	chrome.tabs.query(queryInactiveTabs, function(tabs) {
		for (var i = 0; i < tabs.length; i++) {
			tabIds.push(tabs[i].id);
		};

		closeTabs(tabIds);
	})
	
}

function closeTabs(tabIds) {

	chrome.tabs.remove(tabIds, function() {
		loadConfig();
	})
}

function loadConfig() {
	jQuery.getJSON("config.js", function(config) {
		console.log("config.js");
		console.log(config);
		gConfig = config;

		getCurrentTab();
	});
}

function getCurrentTab() {
	chrome.tabs.getCurrent(function(tab) {
		gSettingsTab = tab;

		gNumTabsInserted = 0;
		insertNextTab();
	})
}

function insertNextTab() {

	console.log("gNumTabsInserted:" + gNumTabsInserted);

	if(gNumTabsInserted >= gConfig.tabs.length) {
		activateSettingsPage();
		return;
	}

	var url = gConfig.tabs[gNumTabsInserted].url;
	chrome.tabs.create({
			"index": gNumTabsInserted,
			"url": url
		}, function(tab) {
			console.log("Inserted tabId:" + tab.id);
			gTabs.push(tab);
			gNumTabsInserted++;
			insertNextTab();
		}
	);
}

function activateSettingsPage() {
	chrome.tabs.update(gSettingsTab.id, {"active": true}, function() {
		rotateTab();
	})
}

function rotateTab() {

	console.log("rotateTab()");

	if(!gEnableRotate)
		return;

	if(gRotationCounter++ >= gMaxRotations) {
		//return;
	}

	var currentTab = gTabs[gNextIndex];
	console.log("Current tab to show:" + gNextIndex);

	var sleepDuration = gConfig.tabs[gNextIndex].duration;

	// Show the current tab
	console.log("Show tabId:" + currentTab.id);
	chrome.tabs.update(currentTab.id, {"active": true}, function() {});

	// Determine the next tab index
	if(++gNextIndex >= gTabs.length) {
		gNextIndex = 0;
	}
	console.log("Determined next tab to be:" + gNextIndex);

	// Preload the future tab in advance
	console.log("Preload tab:" + gNextIndex);
	chrome.tabs.reload(gTabs[gNextIndex].id);
	
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



jQuery(initEventHandlers);