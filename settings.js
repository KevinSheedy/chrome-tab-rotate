

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


jQuery(initEventHandlers);