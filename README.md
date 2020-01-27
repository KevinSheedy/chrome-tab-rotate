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

### lazyLoadTabs - boolean

Load the first two tabs on startup then load subsequent tabs "just in time"

### websites - list

#### url - string

#### duration - integer

Number of seconds the tab will be displayed

#### tabReloadIntervalSeconds - integer

Interval in seconds at which the tab will be reloaded
Set to `0` for no reload

// Automatically reload the settings file from the url provided
"enableAutoReload": false

#### showFromTime - time

Enter the time at which Tab Rotate should begin to show your tab. Enter in 24h format: "hour:minute:seconds"

This is optional

#### showToTime - time

Enter the time at which Tab Rotate should stop to show your tab. Enter in 24h format: "hour:minute:seconds"

This is optional

```json
{
  "settingsReloadIntervalMinutes": 60,
  "fullscreen": true,
  "autoStart": false,
  "lazyLoadTabs": false,
  "websites": [
    {
      "url": "https://github.com/KevinSheedy/chrome-tab-rotate.git",
      "duration": 10,
      "tabReloadIntervalSeconds": 120,
      "showFromTime": "23:15:00",
      "showToTime": "23:20:00"
    },
    {
      "url": "https://chrome.google.com/webstore/detail/tab-rotate/pjgjpabbgnnoohijnillgbckikfkbjed",
      "duration": 10,
      "tabReloadIntervalSeconds": 180
    },
    {
      "url": "https://ie.linkedin.com/in/kevinsheedy",
      "duration": 10,
      "tabReloadIntervalSeconds": 240
    }
  ]
}
```

## Crowdfunding

Support the project by becoming a [Patron](https://www.patreon.com/kevdev)
<br/>
<br/>
<a href="https://www.patreon.com/bePatron?u=17314138"><img src="./src/img/become_a_patron_button@2x.png" height="40" width="170" title="Become a Patron!" alt="Flower"></a>

## Acknowledgments

Top tier Patrons will be acknowledged here
