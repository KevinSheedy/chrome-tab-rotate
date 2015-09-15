var settingsApp = angular.module('settingsApp', []);

settingsApp.controller('SettingsCtrl', function ($scope, $http) {

	var DEFAULT_SOURCE = "DIRECT";
	var DEFAULT_URL = "http://<your_url>";
	var DEFAULT_SETTINGS;
	jQuery.get("config.sample.js", function(res) {
		DEFAULT_SETTINGS = res;

		$scope.reloadSettingsFromDisc();
	})

	$scope.settingsSource = DEFAULT_SOURCE;

	$scope.fetchSettings = function() {

		$scope.httpStatusText = "pending..."
		jQuery.ajax({
			url: $scope.settingsUrl,
			dataType: "text",
			success: function(res) {
				$scope.settings = res;
				$scope.$apply();
			},
			error: function(res) {
				$scope.$apply();
			},
			complete: function(jqXHR, textStatus) {
				$scope.httpStatusText = textStatus;
				$scope.$apply();

			}
		});
	}

	$scope.isSettingsValid = function() {
		try {
        JSON.parse($scope.settings);
    } catch (e) {
        return false;
    }
    return true;
	}

	$scope.resetDefaults = function() {
		$scope.settingsSource = DEFAULT_SOURCE;
		$scope.settings = DEFAULT_SETTINGS;
	}

	$scope.save = function() {
		chrome.storage.sync.set({
			settingsSource: $scope.settingsSource,
			settings: $scope.settings
		});
	}

	$scope.reloadSettingsFromDisc = function() {

		chrome.storage.sync.get(null, function(val) {
			$scope.settingsSource = val.settingsSource || DEFAULT_SOURCE;
			$scope.settings = val.settings || DEFAULT_SETTINGS;
			$scope.settingsUrl = val.settingsUrl || DEFAULT_URL;
			$scope.$apply();
		})

	}

	$scope.clearStorage = function() {
		chrome.storage.sync.clear();
	}


});