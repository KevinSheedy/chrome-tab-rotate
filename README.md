# Chrome Tab Rotate

Allows Chrome to automatically cycle through a set of tabs. Ideal for a Dashboard or wall-mounted display.

- Preloads tabs for smoother transitions
- Configured via a JSON file
- Configuration can be loaded from a remote server

[Tab Rotate on the Chrome Web Store](https://chrome.google.com/webstore/detail/tab-rotate/pjgjpabbgnnoohijnillgbckikfkbjed)

## Sample Config

```json
{
  "settingsReloadIntervalMinutes": 1,
  "fullscreen": false,
  "autoStart": false,
  "lazyLoadTabs": false,
  "closeExistingTabs": false,
  "websites": [
    {
      "url": "chrome-extension://pjgjpabbgnnoohijnillgbckikfkbjed/index.html",
      "duration": 8,
      "tabReloadIntervalSeconds": 15
    },
    {
      "url": "https://www.patreon.com/kevdev",
      "duration": 8,
      "tabReloadIntervalSeconds": 15
    },
    {
      "url": "https://chrome.google.com/webstore/detail/tab-rotate/pjgjpabbgnnoohijnillgbckikfkbjed",
      "duration": 8,
      "tabReloadIntervalSeconds": 15
    }
  ]
}
```

## General Options

| Option | Description | Default |
| --- | --- | --- |
| settingsReloadIntervalMinutes | Interval at which the settings file is reloaded | `1` |
| fullscreen | Open Chrome in fullscreen mode | `false` |
| autoStart | Begin rotating tabs automatically as soon as Chrome is opened | `false` |
| lazyLoadTabs | Load the first two tabs on startup then load subsequent tabs "just in time" | `false` |
| closeExistingTabs | Close existing tabs before opening the configured list of tabs | `false` |
| websites | List of websites and config for each | `[]` |


## Website Options

| Option | Description | Type |
| --- | --- | --- |
| url | Url of website to open | String |
| duration | Number of seconds the tab will be displayed | Number |
| tabReloadIntervalSeconds | Interval in seconds at which the tab will be reloaded. Set to `0` for no reload. | Number |


## Crowdfunding

Support the project by becoming a [Patron](https://www.patreon.com/kevdev)
<br/>
<br/>
<a href="https://www.patreon.com/bePatron?u=17314138"><img src="./src/img/become_a_patron_button@2x.png" height="40" width="170" title="Become a Patron!" alt="Flower"></a>

## Acknowledgments

Top tier Patrons will be acknowledged here
