console.log("background.js");

var queryInfo = {
	"currentWindow": true
}

chrome.tabs.query(queryInfo, function(tabs){
	console.log(tabs.length);
})