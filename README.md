# Chrome Tab Rotate

Allows Chrome to automatically cycle through a set of tabs. Ideal for a Dashboard or wall-mounted display.

 - Preloads tabs for smoother transitions
 - Configured via a JSON file
 - Configuration can be loaded from a remote server

[Tab Rotate on the Chrome Web Store](https://chrome.google.com/webstore/detail/tab-rotate/pjgjpabbgnnoohijnillgbckikfkbjed)

## Settings

### settingsReloadIntervalMinutes - integer
Interval at which the settings file is reloaded.

### fullscreen - boolean
Open Chrome in fullscreen mode

### autoStart - boolean
Begin rotating tabs automatically as soon as Chrome is opened

### websites - list

#### url - string

#### duration - integer
Number of seconds the tab will be displayed

#### tabReloadIntervalSeconds - integer
Interval in seconds at which the tab will be reloaded
Set to `0` for no reload


	// Automatically reload the settings file from the url provided
	"enableAutoReload": false

```json
{
	"settingsReloadIntervalMinutes": 60,
	"fullscreen": true,
	"websites" : [
		{
			"url" : "https://github.com/KevinSheedy/chrome-tab-rotate.git",
			"duration" : 10,
			"tabReloadIntervalSeconds": 120
		},
		{
			"url" : "https://chrome.google.com/webstore/detail/tab-rotate/pjgjpabbgnnoohijnillgbckikfkbjed",
			"duration" : 10,
			"tabReloadIntervalSeconds": 180
		},
		{
			"url" : "https://ie.linkedin.com/in/kevinsheedy",
			"duration" : 10,
			"tabReloadIntervalSeconds": 240
		}
	]
}
```