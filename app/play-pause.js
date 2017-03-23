function renderStatus(statusText) {
	document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
	
	chrome.browserAction.setIcon({
		path: "Pause-38.png"
	});

	chrome.storage.local.get("playPauseStatus", function(storage) {

		if(storage.playPauseStatus == "PLAY") {
			pause();
		}
		else {
			play();
		}
	})
});


function play() {

	chrome.browserAction.setIcon({path: "img/Pause-38.png"});
	chrome.storage.local.set({"playPauseStatus": "PLAY"});
	chrome.runtime.sendMessage({playPauseStatus: "PLAY"});
	renderStatus("Tab Rotate Running");
}

function pause() {

	chrome.browserAction.setIcon({path: "img/Play-38.png"});
	chrome.storage.local.set({"playPauseStatus": "PAUSE"});
	chrome.runtime.sendMessage({playPauseStatus: "PAUSE"});
	renderStatus("Tab Rotate Stopped");
}