var settingsApp = angular.module('settingsApp', []);

settingsApp.controller('SettingsCtrl', function ($scope, $http) {

	// Google Analytics
	ga('send', 'pageview', '/options.html');

	loadSampleConfig()
		.then(initScope);

	function loadSampleConfig() {
		return new Promise(function(resolve, reject) {
			var storageObject = {
				source: "DIRECT",
				url: "https://raw.githubusercontent.com/KevinSheedy/chrome-tab-rotate/master/app/config.sample.json",
				configFile: ""
			}

			jQuery.get("/app/config.sample.json", null, function(text) {
				storageObject.configFile = text;

				// Resolves to a function that builds a new Storage Object
				resolve(function(){
					return  jQuery.extend({}, storageObject);
				});
			}, 'text')
		})
	}

	function initScope(newStorageObject) {

		$scope.isFetchInProgress = false;
		$scope.fetchSucceeded = null;
		$scope.editMode = false;

		$scope.fetchRemoteSettings = function() {

			$scope.httpStatusText = "pending..."
			$scope.isFetchInProgress = true;
			jQuery.ajax({
				url: $scope.settings.url,
				dataType: "text",
				success: function(res, textStatus, jqXHR) {
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

		$scope.isValidConfigFile = function(jsonText) {
			try {
				JSON.parse(jsonText);
			} catch (e) {
				return false;
			}
			return true;
		}

		$scope.resetDefaults = function() {
			$scope.settings = newStorageObject();
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

			chrome.storage.sync.get(null, function(allStorage) {

				$scope.settings = jQuery.isEmptyObject(allStorage) ? newStorageObject() : allStorage;

				if(jQuery.isEmptyObject(allStorage)) {
					$scope.settings = newStorageObject();
					chrome.storage.sync.set($scope.settings, function(){
						console.log("Local storage is empty. Saving some default settings")
					});
				} else {
					$scope.settings = allStorage;
				}

				$scope.form.$setPristine();
				$scope.$apply();
			})

		}

		$scope.clearStorage = function() {
			chrome.storage.sync.clear();
		}

		$scope.settings = newStorageObject();
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