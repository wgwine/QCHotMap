angular.module('d3', []);
angular.module('App.services', []);
angular.module('App.filters', []);
angular.module('App.directives', ['d3']);
angular.module('App.config', []);
angular.module('App.dataVis', ['d3']);
angular.module('App.controllers', ['ngRoute', 'App.services']);

var cltdmapp = angular.module('App', ['App.controllers', 'App.services', 'App.directives', 'App.config', 'ngRoute', 'd3', 'App.dataVis']);

angular.module('App')
.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: '/app/modules/dataVis/layout.html',
        caseInsensitiveMatch: true
    })
}])
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();