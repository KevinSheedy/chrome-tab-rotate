var settingsApp = angular.module('settingsApp', []);

settingsApp.controller('SettingsCtrl', function ($scope, $http) {



	var getDefaults = (function() {

		var DEFAULT_CONFIG = {
			source: "DIRECT",
			url: "http://<your_url>",
			configFile: ""
		}

		jQuery.get("/app/config.sample.json", function(res) {
			DEFAULT_CONFIG.configFile = res;

			initScope();
		})

		return function() {
			return jQuery.extend({}, DEFAULT_CONFIG);
		}
	})();

	function initScope() {


		$scope.fetchSettings = function() {

			$scope.httpStatusText = "pending..."
			jQuery.ajax({
				url: $scope.settings.url,
				dataType: "text",
				success: function(res) {
					$scope.settings.configFile = res;
					$scope.urlValid = true;
					$scope.$apply();
				},
				error: function(res) {
					$scope.urlValid = false;
					$scope.$apply();
				},
				complete: function(jqXHR, textStatus) {
					$scope.httpStatusText = textStatus;
					$scope.$apply();

				}
			});
		}

		$scope.validateConfigFile = function() {
			try {
				JSON.parse($scope.settings.configFile);
			} catch (e) {
				return false;
			}
			return true;
		}

		$scope.resetDefaults = function() {
			$scope.settings = getDefaults();
			$scope.form.$setDirty();
		}

		$scope.save = function() {
			chrome.storage.sync.set($scope.settings, function() {
				$scope.formSaved = true;
				$scope.form.$setPristine();
				$scope.$apply();
			});
		}

		$scope.reloadSettingsFromDisc = function() {

			chrome.storage.sync.get(null, function(val) {

				$scope.settings = jQuery.isEmptyObject(val) ? getDefaults() : val;
				$scope.form.$setPristine();
				$scope.$apply();
			})

		}

		$scope.clearStorage = function() {
			chrome.storage.sync.clear();
		}

		$scope.settings = getDefaults();
		$scope.reloadSettingsFromDisc();

		$scope.$watch('settings', function() {
			$scope.formStatus = "MODIFIED";
		}, true);

		$scope.formStatus = "CLEAN";

		$scope.formMessage = function() {
			if($scope.formStatus == "MODIFIED")
				return "modified";
			else if($scope.formStatus == "SAVED")
				return "Saved";
			else
				return "";
		}
	}

});