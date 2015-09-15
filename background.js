document.addEventListener('DOMContentLoaded', function() {
	console.log("foo.js");
});


chrome.runtime.onMessage.addListener( function(request) {
	console.log("Got message:" + request.playPauseStatus);
});



console.log("background.js");

var gSettingsUrl;
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
	gNextIndex = 0;
	getTabsToClose();
}

function stop() {
	gEnableRotate = false;
}

chrome.storage.local.get("playPauseStatus", function(storage) {
	console.log("playPauseStatus:");
	console.log(storage);
});

function save() {

	gSettingsUrl = jQuery("#settingsUrl").val();
	chrome.storage.sync.set({"settingsUrl": gSettingsUrl});

	gConfig = JSON.parse(jQuery("#settingsTextArea").val());
	chrome.storage.sync.set({"settings": gConfig});


}

function readUrlFromStorage() {

	chrome.storage.sync.get("settingsUrl", function(storage) {
		if(storage.settingsUrl) {
			gSettingsUrl = storage.settingsUrl;
		}
		else {
			gSettingsUrl = "config.sample.js";
			chrome.storage.sync.set({"settingsUrl": gSettingsUrl});
		}
		jQuery("#settingsUrl").val(gSettingsUrl);
	});
}

function readSettingsFromStorage() {

	chrome.storage.sync.get("settings", function(storage) {
		if(storage.settings) {
			jQuery("#settingsTextArea").val(storage.settings);
			gConfig = JSON.parse(storage.settings);
		}
		else {
			jQuery.get("config.sample.js", null, function(response) {
				jQuery("#settingsTextArea").val(response);
				gConfig = JSON.parse(response);
				chrome.storage.sync.set({"settings": response});
			});
		}
		jQuery("#settingsUrl").val(gSettingsUrl);
	});

}

function initEventHandlers() {

	jQuery("#start").click(start);
	jQuery("#stop").click(stop);
	jQuery("#save").click(save);
	jQuery("#fetchSettings").click(fetchSettings);

	//chrome.storage.sync.clear();
	readUrlFromStorage();
	readSettingsFromStorage();
}

function fetchSettings() {
	$.ajax({
		dataType: "text",
		url: gSettingsUrl,
		success: fetchSuccess,
		error: fetchError
	});
}

function fetchSuccess(response) {
	//jQuery("#settingsTextArea").val(JSON.stringify(response, null, 4));
	jQuery("#settingsTextArea").val(response);

}

function fetchError() {
	console.log("fetch error");
}

function loadSettings() {
	jQuery.getJSON("config.sample.js", function(data) {
		console.log(data);

		chrome.storage.sync.set(data, function() {
			chrome.storage.sync.get(null, function(val) {
				console.log("storage returned:");
				console.log(val);
			})
		})
	});
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
		getCurrentTab();
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