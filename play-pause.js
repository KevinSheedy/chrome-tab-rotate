



function renderStatus(statusText) {
	document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
	

	chrome.browserAction.setIcon({
		path: "Pause-38.png"
	});


	chrome.storage.local.get("playPauseStatus", function(storage) {

		if(storage.playPauseStatus == "PLAYING") {
			pause();
		}
		else {
			play();
		}
	})
});


function play() {

	chrome.browserAction.setIcon({path: "img/Pause-38.png"});
	chrome.storage.local.set({"playPauseStatus": "PLAYING"});
	renderStatus("Tab Rotate Running");
}

function pause() {

	chrome.browserAction.setIcon({path: "img/Play-38.png"});
	chrome.storage.local.set({"playPauseStatus": "PAUSED"});
	renderStatus("Tab Rotate Stopped");
}