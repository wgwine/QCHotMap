﻿
angular.module('App.dataVis')
  .controller('dataVisGraphCtrl', ['$scope', '$rootScope', '$window', '$http', '$interval', '$timeout',
    'd34Service',
    function ($scope, $rootScope, $window, $http, $interval, $timeout, d34Service) {
      var svg;
      $scope.showControls = false;
      $scope.heatColors = [
        '#ff0000',
        '#ff8000',
        '#ffff00',
        '#80ff00',
        '#00ffff'
      ];
      var c311 = ['#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40',
        '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff', '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff', '#ff00ff', '#ff00bf', '#ff0080', '#ff0040', '#ff0000'];
      var crashColorScale = d3.scaleOrdinal().range($scope.heatColors);
      var crashColorScale = d3.scaleOrdinal()
        .domain([1, 2, 3, 4, 5]).range($scope.heatColors);
      var data311ColorScale = d3.scaleOrdinal().range(c311.reverse());
      var sizeScale = d3.scaleLinear().domain([2, 1048576]).range([1, 35]);

      var context;
      $scope.dataBounds = { left: 0, right: -1000, top: 0, bottom: 1000 };
      $scope.crashMap = [];
      $scope.signalsMap = [];
      $scope.predatorMap = [];
      $scope.arrestsMap = [];
      $scope.data311Map = [];
      $scope.data311Top20 = [];
      $scope.coords = [];
      $scope.currentLayers = [];
      $scope.selectRecords = function (types) {
        $scope.coords = [];
        if (types.indexOf("accidents") > -1) {
          $scope.coords = $scope.coords.concat(enumerateAssociativeArray($scope.crashMap));
        }
        if (types.indexOf("signals") > -1) {
          $scope.coords = $scope.coords.concat(enumerateAssociativeArray($scope.signalsMap));
        }
        if (types.indexOf("predators") > -1) {
          $scope.coords = $scope.coords.concat(enumerateAssociativeArray($scope.predatorMap));
        }
        if (types.indexOf("arrests") > -1) {
          $scope.coords = $scope.coords.concat(enumerateAssociativeArray($scope.arrestsMap));
        }
        if (types.indexOf("data311") > -1) {
          $scope.coords = $scope.coords.concat($scope.data311Map);
        }
      }

      $scope.toggleLayer = function (layerName) {
        if ($scope.currentLayers.indexOf(layerName) > -1) {
          $scope.currentLayers = _.without($scope.currentLayers, layerName);
        } else {
          $scope.currentLayers.push(layerName);
        }
        $scope.selectRecords($scope.currentLayers);
        $scope.overlay.onPan();
      }

      $scope.processTrafficSignals = function (records) {
        var i = 0;
        records.map(e => {
          var tmp = e.Longitude;
          e.Longitude = e.Latitude;
          e.Latitude = tmp;

          if (!$scope.signalsMap[e.Latitude + "" + e.Longitude]) {
            var coord = {
              id: $scope.makeid(),
              opacity: .6,
              stroke: '#000',
              color: "#1F1",
              size: 2,
              latLng: new google.maps.LatLng(
                e.Latitude,
                e.Longitude
              )
            };
            $scope.signalsMap[e.Latitude + "" + e.Longitude] = coord;
          }
          i++;
        });
      }
      $scope.processPredators = function (records) {
        var i = 0;
        records.map(e => {
          if (!$scope.predatorMap[e.Latitude + "" + e.Longitude]) {
            var coord = {
              id: e.oid,
              opacity: .5,
              color: "#F11",
              stroke: '#fff',
              size: 2,
              latLng: new google.maps.LatLng(
                e.Latitude,
                e.Longitude
              )
            };
            $scope.predatorMap[e.Latitude + "" + e.Longitude] = coord;
          }
          i++;
        });
      }
      $scope.processArrests = function (records) {
        var i = 0;
        records.map(e => {
          if (!$scope.arrestsMap[e.Latitude + "" + e.Longitude]) {
            var coord = {
              id: $scope.makeid(),
              opacity: 1,
              color: "#ff8f00",
              stroke: '#fff',
              size: 2,
              latLng: new google.maps.LatLng(
                e.Latitude,
                e.Longitude
              )
            };
            $scope.arrestsMap[e.Latitude + "" + e.Longitude] = coord;
          }
          i++;
        });
      }
      $scope.processAccidents = function (records) {
        var i = 0;
        var dataIncidents = [];
        records.map(e => {
          if (isNaN(dataIncidents[e.CRSH_LEVL + ""]))
            dataIncidents[e.CRSH_LEVL + ""] = 5;
          dataIncidents[e.CRSH_LEVL + ""]++;
        });

        var incidentCount = [];
        for (var key in dataIncidents) {
          if (dataIncidents.hasOwnProperty(key))
            incidentCount.push({ key: key, value: dataIncidents[key] });
        }
        //console.log(JSON.stringify(incidentCount));
        var ordered = _.orderBy(records, ['CRSH_LEVL'], ['desc']);
        ordered.map(e => {
          if (e.CRSH_LEVL != 'NA') {
            var item = $scope.crashMap[e.Latitude + "" + e.Longitude + ":" + e.CRSH_LEVL];
            if (item) {
              if (item.size > 10) {
                item.gradient = true;
              }
              item.size += 1;
              item.opacity += .01;
            } else {
              var coord = {
                id: $scope.makeid(),
                opacity: .3 / (e.CRSH_LEVL),
                color: crashColorScale((e.CRSH_LEVL)),
                size: 5/ (e.CRSH_LEVL),
                date: new Date(e.DATE_VAL),
                latLng: new google.maps.LatLng(
                  e.Latitude,
                  e.Longitude
                )
              };
              $scope.crashMap[e.Latitude + "" + e.Longitude + ":" + e.CRSH_LEVL] = coord;
            }
            i++;
          }
        });
      }
      $scope.data311ColorScale = function (key) {
        return data311ColorScale(key);
      }
      $scope.processData311 = function (records) {
        var i = 0;
        var dataIncidents = [];
        records.map(e => {
          e.TITLE = (typeof e.TITLE == "string" ? e.TITLE : '').toLowerCase();
          if (isNaN(dataIncidents[e.TITLE]))
            dataIncidents[e.TITLE] = 0;
          dataIncidents[e.TITLE]++;
        });

        var incidentCount = [];
        for (var key in dataIncidents) {
          if (dataIncidents.hasOwnProperty(key))
            incidentCount.push({ key: key, value: dataIncidents[key] });
        }
        var ordered = _.orderBy(incidentCount, ['value'], ['desc']);
        for (var i = 0; i < 20; i++) {
          data311ColorScale(ordered[i].key);
          $scope.data311Top20.push(ordered[i]);
        }

        var orderedR = _.orderBy(records, ['REQ_NUM'], ['asc']);
        orderedR.map(e => {
          var item = $scope.data311Map[e.Latitude + "" + e.Longitude];
          if (item) {
            if (item.size <= 40) {
              item.size += .5;

            } else {
              item.opacity += .05;
            }
          } else {
            var coord = {
              id: $scope.makeid(),
              opacity: .25,
              color: data311ColorScale(e.TITLE),
              title: e.TITLE.toLo,
              size: 2,
              latLng: new google.maps.LatLng(
                e.Latitude,
                e.Longitude
              )
            };
            $scope.data311Map.push(coord);
          }
          i++;
        });
      }
      $scope.processRecords = function (err, accidents, signals, predators, data311, arrests) {
        $scope.processAccidents(accidents);
        $scope.processTrafficSignals(signals);
        $scope.processPredators(predators);
        $scope.processArrests(arrests);
        $scope.processData311(data311);
        $scope.selectRecords([]);

        setTimeout(function () {
          $scope.$apply(function () {
            $scope.showControls = true;
          });
        }, 200);
        $scope.overlay.onDataLoaded();
      }

      $scope.initMap = function () {
        var el = document.querySelector('#map');
        var google = window.google;
        function GMOverlay(map) {
          this.map = map;
          $scope.i = 0;
          this.onPan = this.onPan.bind(this);
          this.setMap(map);
          d3.queue()
            .defer(d3.json, 'js/trafficJson.json')
            .defer(d3.json, 'js/trafficSignal.json')
            .defer(d3.json, 'js/predator2.json')
            .defer(d3.json, 'js/311Data.json')
            .defer(d3.json, 'js/crimeData.json')
            .await($scope.processRecords);
        }

        GMOverlay.prototype = new google.maps.OverlayView();

        GMOverlay.prototype.drawtimeseries = function (that) {
          for (var a = 0; a < 40; a++) {
            var proj = that.getProjection();
            var sizem = sizeScale(Math.pow(2, $scope.map.getZoom()));
            let sz = 0;

            var e = $scope.coords[$scope.i];
            while (e && !(e.latLng.lat() >= $scope.bounds.f.b &&
              e.latLng.lat() <= $scope.bounds.f.f &&
              e.latLng.lng() >= $scope.bounds.b.b &&
              e.latLng.lng() <= $scope.bounds.b.f)) {
              $scope.i++;
              e = $scope.coords[$scope.i];
            }
            if (e !== undefined) {
              try {
                sz = (e.size * sizem);
              } catch (r) {
                console.log(JSON.stringify(e));
              }
              var context = that.offscreenContext;
              context.globalAlpha = e.opacity;
              context.fillStyle = e.color;
              var x = proj.fromLatLngToContainerPixel(e.latLng).x;
              var y = proj.fromLatLngToContainerPixel(e.latLng).y;

              context.beginPath();
              context.moveTo(x + sz, y);
              context.arc(x, y, sz, 0, sz * Math.PI);
              context.closePath();
              // var gradient = context.createRadialGradient(x, y, 0, x, y, sz);
              // gradient.addColorStop(0, e.color);
              // gradient.addColorStop(1, 'transparent');
              // context.fillStyle = gradient;
              context.fill();
              if (e.stroke)
                that.offscreenContext.stroke();

            }
            $scope.i++;
            if ($scope.i >= $scope.coords.length) {
              $scope.i = 0;
              $scope.overlay.offscreenContext.clearRect(0, 0, $('#map').width(), $('#map').height());
              $scope.overlay.context.clearRect(0, 0, $('#map').width(), $('#map').height());
            }
          }
        }
        GMOverlay.prototype.repaint = _.debounce(function () {
          var that = this;
          var proj = this.getProjection();
          var sizem = sizeScale(Math.pow(2, $scope.map.getZoom()));
          let sz = 0;
          $scope.coords.filter(e => {
            return e.latLng.lat() >= $scope.bounds.f.b &&
              e.latLng.lat() <= $scope.bounds.f.f &&
              e.latLng.lng() >= $scope.bounds.b.b &&
              e.latLng.lng() <= $scope.bounds.b.f
          }).map(e => {
            sz = (e.size * sizem);
            var context = that.offscreenContext;
            context.globalAlpha = e.opacity;
            context.fillStyle = e.color;
            var x = proj.fromLatLngToContainerPixel(e.latLng).x;
            var y = proj.fromLatLngToContainerPixel(e.latLng).y;

            context.beginPath();
            context.moveTo(x + sz, y);
            context.arc(x, y, sz, 0, sz * Math.PI);
            context.closePath();
            if (e.gradient) {
              var gradient = context.createRadialGradient(x, y, 0, x, y, sz);
              gradient.addColorStop(0, e.color);
              gradient.addColorStop(.25, e.color);
              gradient.addColorStop(1, 'transparent');
              context.fillStyle = gradient;
            }
            context.fill();
            if (e.stroke)
              that.offscreenContext.stroke();
          });
        }, 200);

        GMOverlay.prototype.onDataLoaded = function () {
          var that = this;
          this.canvas = document.createElement('canvas');
          this.canvas.width = $('#map').width();
          this.canvas.height = $('#map').height();
          this.context = this.canvas.getContext("2d");
          this.canvas.style.position = 'absolute';
          this.canvas.style.top = 0;
          this.canvas.style.left = 0;
          this.canvas.style.pointerEvents = 'none';

          this.offscreenCanvas = document.createElement('canvas');
          this.offscreenContext = this.offscreenCanvas.getContext('2d');
          this.offscreenCanvas.width = $('#map').width();
          this.offscreenCanvas.height = $('#map').height();

          $scope.bounds = this.map.getBounds();

          this.onPan();

          document.body.appendChild(this.canvas);
          (function animloop() {
            requestAnimFrame(animloop);
            $scope.overlay.context.save();
            $scope.overlay.context.clearRect(0, 0, $('#map').width(), $('#map').height());
            var image = $scope.overlay.offscreenContext.getImageData(0,
              0, $('#map').width(), $('#map').height());
            // copy into visual canvas at different position
            $scope.overlay.context.putImageData(image, 0, 0);
            $scope.overlay.context.restore();

          })();
          this.map.addListener('bounds_changed', this.onPan);
        }
        GMOverlay.prototype.onAdd = function () {
        };

        GMOverlay.prototype.onPan = function () {
          var that = this;
          var proj = this.getProjection();
          $scope.bounds = this.map.getBounds();
          var proj = $scope.overlay.getProjection();
          $scope.overlay.offscreenContext.clearRect(0, 0, $('#map').width(), $('#map').height());
          $scope.overlay.context.clearRect(0, 0, $('#map').width(), $('#map').height());
          this.repaint();
        };

        GMOverlay.prototype.onRemove = function () {
          this.map.removeListener('bounds_changed', this.onPan);
          this.canvas.parentNode.removeChild(this.canvas);
          this.canvas = null;
        };

        GMOverlay.prototype.draw = function () {
        };

        $scope.map = new google.maps.Map(el, {
          center: new google.maps.LatLng(35.2253679, -80.8398772),
          zoom: 13,
          disableDefaultUI: true,
          backgroundColor: '#002732',
        });

        fetch('js/map-styles.json')
          .then((response) => response.json())
          .then(function (styles) {
            $scope.map.mapTypes.set('neutral-blue', new google.maps.StyledMapType(styles));
            $scope.map.setMapTypeId('neutral-blue');
          });

        $scope.overlay = new GMOverlay($scope.map);
      }

      d34Service.d3().then(function (d3s) {
        d3 = d3s;
        $timeout(function () {
          $scope.initMap();
        }, 50)
      });
      var enumerateAssociativeArray = function (aArray) {
        var result = [];
        for (var key in aArray) {
          if (aArray.hasOwnProperty(key))
            result.push(aArray[key]);
        }
        return result;
      }
      $scope.makeid = function () {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 12; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
      }
    }]);