angular.module('App.services')
.factory('d34Service', ['$document', '$window', '$q', '$rootScope',
  function ($document, $window, $q, $rootScope) {
      var d = $q.defer();
      var d34service = {
              d3: function () { return d.promise; }
          };
      function onScriptLoad() {
          $rootScope.$apply(function () { d.resolve($window.d3); });
      }

      var scriptTag2 = $document[0].createElement('script');
      scriptTag2.type = 'text/javascript';
      scriptTag2.async = false;
      scriptTag2.src = 'https://d3js.org/d3-scale-chromatic.v1.min.js';
      scriptTag2.onreadystatechange = function () {
          if (this.readyState == 'complete') onScriptLoad();
      }
      scriptTag2.onload = onScriptLoad;

      var s = $document[0].getElementsByTagName('body')[0];
      s.appendChild(scriptTag2);

      return d34service;
  }]);