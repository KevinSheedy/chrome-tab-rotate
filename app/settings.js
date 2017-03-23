var settingsApp = angular.module('settingsApp', ['ui']);

settingsApp.controller('SettingsCtrl', function ($scope, $http) {

	var getDefaults = (function() {

		var DEFAULT_CONFIG = {
			source: "DIRECT",
			url: "http://_url_to_your_config_file.json",
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

		$scope.isFetchInProgress = false;
		$scope.fetchSucceeded = true;
		$scope.editMode = false;

		$scope.fetchSettings = function() {

			$scope.httpStatusText = "pending..."
			$scope.isFetchInProgress = true;
			jQuery.ajax({
				url: $scope.settings.url,
				dataType: "text",
				success: function(res) {
					$scope.settings.configFile = res;
					$scope.fetchSucceeded = true;
					$scope.$apply();
					Prism.highlightAll();
				},
				error: function(res) {
					$scope.fetchSucceeded = false;
					$scope.$apply();
				},
				complete: function(jqXHR, textStatus) {
					$scope.isFetchInProgress = false;
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

		$scope.isValidConfigFile = function(val) {
			try {
				JSON.parse(val);
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
				$scope.editMode = false;
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

		// HACK: Prism seems to break angular bindings
		$scope.$watch('settings.configFile', function(val) {
			jQuery(".config-code-block").text(val);
			Prism.highlightAll();
		}, true);

		$scope.$watch('editMode', function() {
			if($scope.editMode) {
				document.getElementById("configTextArea").focus();
			}

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

		$scope.alwaysTrue = function() {
			return true;
		}

		$scope.alwaysFalse = function() {
			return false;
		}

		$scope.isValidUrl = function() {
			return $scope.form.url.$pristine || $scope.fetchSucceeded;
		}

	}

});


angular.module('Prism', []).
	directive('prism', [function() {
		return {
			restrict: 'A',
			link: function ($scope, element, attrs) {
				element.ready(function() {
					Prism.highlightElement(element[0]);
				});
			}
		} 
	}]
);