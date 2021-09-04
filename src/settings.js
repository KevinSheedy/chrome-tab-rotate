import analytics from './analytics';
import sampleConfig from './config.sample.json';

const { chrome, angular, document } = globalThis;

function loadSampleConfig() {
  return {
    source: 'DIRECT',
    url: 'https://raw.githubusercontent.com/KevinSheedy/chrome-tab-rotate/master/src/config.sample.json',
    configFile: JSON.stringify(sampleConfig, null, 2),
  };
}

const settingsApp = angular.module('settingsApp', []);

settingsApp.controller('SettingsCtrl', ($scope) => {
  console.log('init');
  const { jQuery } = globalThis;
  analytics.optionsPageview();

  initScope(loadSampleConfig);

  function initScope(newStorageObject) {
    $scope.isFetchInProgress = false;
    $scope.fetchSucceeded = null;
    $scope.editMode = false;

    $scope.fetchRemoteSettings = () => {
      $scope.httpStatusText = 'pending...';
      $scope.isFetchInProgress = true;
      jQuery.ajax({
        url: $scope.settings.url,
        dataType: 'text',
        success: (res) => {
          $scope.settings.configFile = res;
          $scope.fetchSucceeded = true;
          $scope.$apply();
          globalThis.Prism.highlightAll();
        },
        error: () => {
          $scope.fetchSucceeded = false;
          $scope.$apply();
        },
        complete: () => {
          $scope.isFetchInProgress = false;
          $scope.$apply();
        },
      });
    };

    $scope.validateConfigFile = () => {
      try {
        JSON.parse($scope.settings.configFile);
      } catch (e) {
        return false;
      }
      return true;
    };

    $scope.isValidConfigFile = (jsonText) => {
      try {
        JSON.parse(jsonText);
      } catch (e) {
        return false;
      }
      return true;
    };

    $scope.resetDefaults = () => {
      $scope.settings = newStorageObject();
      $scope.form.$setDirty();
    };

    $scope.save = () => {
      chrome.storage.sync.set($scope.settings, () => {
        $scope.formSaved = true;
        $scope.editMode = false;
        $scope.form.$setPristine();
        $scope.$apply();
      });
    };

    $scope.reloadSettingsFromDisc = () => {
      chrome.storage.sync.get(null, (allStorage) => {
        $scope.settings = jQuery.isEmptyObject(allStorage)
          ? newStorageObject()
          : allStorage;

        if (jQuery.isEmptyObject(allStorage)) {
          $scope.settings = newStorageObject();
          chrome.storage.sync.set($scope.settings, () => {
            console.log('Local storage is empty. Saving some default settings');
          });
        } else {
          $scope.settings = allStorage;
        }

        $scope.form.$setPristine();
        $scope.$apply();
      });
    };

    $scope.clearStorage = () => {
      chrome.storage.sync.clear();
    };

    $scope.settings = newStorageObject();
    $scope.reloadSettingsFromDisc();

    $scope.$watch(
      'settings',
      () => {
        $scope.formStatus = 'MODIFIED';
      },
      true,
    );

    // HACK: Prism seems to break angular bindings
    $scope.$watch(
      'settings.configFile',
      (val) => {
        jQuery('.config-code-block').text(val);
        globalThis?.Prism?.highlightAll();
      },
      true,
    );

    $scope.$watch(
      'editMode',
      () => {
        if ($scope.editMode) {
          document.getElementById('configTextArea').focus();
        }
      },
      true,
    );

    $scope.formStatus = 'CLEAN';

    $scope.formMessage = () => {
      if ($scope.formStatus === 'MODIFIED') return 'modified';
      if ($scope.formStatus === 'SAVED') return 'Saved';
      return '';
    };

    $scope.alwaysTrue = () => true;

    $scope.alwaysFalse = () => false;

    $scope.isValidUrl = () =>
      $scope.form.url.$pristine || $scope.fetchSucceeded;
  }
});

angular.module('Prism', []).directive('prism', [
  () => ({
    restrict: 'A',
    link: ($scope, element) => {
      element.ready(() => {
        globalThis?.Prism?.highlightElement(element[0]);
      });
    },
  }),
]);
