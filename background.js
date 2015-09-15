document.addEventListener('DOMContentLoaded', function() {
	console.log("foo.js");
});


chrome.runtime.onMessage.addListener( function(request) {
	console.log("Got message:" + request.playPauseStatus);
});