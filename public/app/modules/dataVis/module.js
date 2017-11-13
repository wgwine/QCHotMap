﻿
angular.module('App.dataVis')
    .controller('dataVisGraphCtrl', ['$scope', '$rootScope', '$window', '$http', '$interval', '$timeout',
        'd34Service',
        function ($scope, $rootScope, $window, $http, $interval, $timeout, d34Service) {

            var svg;


            $scope.colors = ['#FF4E50', '#FC913A', '#F9D423', '#EDE574', '#E1F5C4', '#FF4E50', '#FC913A', '#F9D423'];
            $scope.heatColors = ['#000083',
                '#027ec7',
                '#03bde2',
                '#41ffc1',
                '#d3ff2d',
                '#fda900',
                '#fa1500',
                '#800000'];
            var crashColorScale = d3.scaleOrdinal().range($scope.heatColors);
            var crashColorScale = d3.scaleOrdinal()
            .domain([1,2,3,4,5,6,7,8]).range($scope.heatColors);
            for(var i = 0; i<9;i++){
                crashColorScale(i+1)
            }
        
  
            var c311 = ['#ffffe0', '#fff2c7', '#ffe4b1', '#ffd69d',
                '#ffc88e', '#ffb981', '#ffaa76', '#ff9a6e', '#fc8968', '#f77a63', '#f16b5f', '#e95d5a',
                '#e14f55', '#d8404e', '#cd3346', '#c2263d', '#b61832', '#a80c25', '#9b0316', '#8b0000', '#fff'];
            var data311ColorScale = d3.scaleOrdinal().range($scope.heatColors.reverse());

            //do this dynamically
            var sizeScale = d3.scaleLinear().domain([2, 1048576]).range([1, 35]);


            var context;
            $scope.dataBounds= {left:0,right:-1000,top:0,bottom:1000};
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
                    $scope.coords = $scope.coords.concat(enumerateAssociativeArray($scope.data311Map));
                }
            }
            var enumerateAssociativeArray = function (aArray) {
                var result = [];
                for (var key in aArray) {
                    if (aArray.hasOwnProperty(key))
                        result.push(aArray[key]);
                }
                return result;
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
                            stroke:'#000',
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
                            stroke:'#fff',
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
                            stroke:'#fff',
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
                var dataIncidents=[];
                records.map(e => {
                    if(isNaN(dataIncidents[e.CRSH_LEVL+""]))
                        dataIncidents[e.CRSH_LEVL+""] = 0;
                    dataIncidents[e.CRSH_LEVL+""]++;
                });

                var incidentCount = [];
                for (var key in dataIncidents) {
                    if (dataIncidents.hasOwnProperty(key))
                        incidentCount.push({key:key, value:dataIncidents[key]});
                }
                console.log(JSON.stringify(incidentCount));
                records.map(e => {
                    if(e.CRSH_LEVL !='NA'){
                    var item = $scope.crashMap[e.Latitude + "" + e.Longitude];
                    if (item) {
                        if (item.size <= 40) {
                            item.size += .5;
                        }
                    } else {
                        //console.log(crashColorScale($scope.heatColors.length-e.CRSH_LEVL) +" - "+e.CRSH_LEVL)
                        var coord = {
                            id: $scope.makeid(),
                            opacity: .5/e.CRSH_LEVL,
                            color: crashColorScale((5-e.CRSH_LEVL) +3),
                            size: 2,
                            latLng: new google.maps.LatLng(
                                e.Latitude,
                                e.Longitude
                            )
                        };
                        $scope.crashMap[e.Latitude + "" + e.Longitude] = coord;
                    }                
                    i++;
                }
                });
            }
            $scope.data311ColorScale = function(key){
                return data311ColorScale(key);
            }
            $scope.processData311 = function (records) {
                var i = 0;
                var dataIncidents = [];
                records.map(e => {
                    e.TITLE = (typeof e.TITLE =="string"? e.TITLE: '').toLowerCase();
                    if(isNaN(dataIncidents[e.TITLE]))
                        dataIncidents[e.TITLE] = 0;
                    dataIncidents[e.TITLE]++;
                });

                var incidentCount = [];
                for (var key in dataIncidents) {
                    if (dataIncidents.hasOwnProperty(key))
                        incidentCount.push({key:key, value:dataIncidents[key]});
                }
                var ordered= _.orderBy(incidentCount, ['value'], ['desc']);
                for(var i = 0; i<8; i++){
                    data311ColorScale(ordered[i].key);
                    $scope.data311Top20.push(ordered[i]);
                }

                records.map(e => {
                    var item = $scope.data311Map[e.Latitude + "" + e.Longitude];
                    if (item) {
                        if (item.size <= 40) {
                            item.size += .5;
                            item.opacity += .05;
                        }else{
     
                        }
                        
                    } else {
                        var coord = {
                            id: $scope.makeid(),
                            opacity: .25,
                            color: data311ColorScale(e.TITLE),
                            title:e.TITLE.toLo,
                            size: 2,
                            latLng: new google.maps.LatLng(
                                e.Latitude,
                                e.Longitude
                            )
                        };
                        $scope.data311Map[e.Latitude + "" + e.Longitude] = coord;
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

                $scope.overlay.onDataLoaded();
            }

            $scope.initMap = function () {
                var el = document.querySelector('#map');
                var google = window.google;
                function SVGOverlay(map) {
                    this.map = map;
                    this.canvas = null;
                    this.onPan = this.onPan.bind(this);
                    var that = this;
                    
                    this.setMap(map);

                    d3.queue()
                        .defer(d3.json, 'js/trafficJson.json')
                        .defer(d3.json, 'js/trafficSignal.json')
                        .defer(d3.json, 'js/predator2.json')
                        .defer(d3.json, 'js/311Data.json')
                        .defer(d3.json, 'js/crimeData.json')
                        .await($scope.processRecords);
                }

                SVGOverlay.prototype = new google.maps.OverlayView();
                SVGOverlay.prototype.repaint = _.debounce(function(){                  
                    var that = this;
                    var proj = this.getProjection();
                    var sizem=sizeScale(Math.pow(2, $scope.map.getZoom()));
                    let sz=0;
                    $scope.coords.filter(e=> {
                        return e.latLng.lat() >= $scope.bounds.f.b && 
                        e.latLng.lat() <= $scope.bounds.f.f && 
                        e.latLng.lng() >= $scope.bounds.b.b && 
                        e.latLng.lng() <= $scope.bounds.b.f
                    }).map(e => {  
                        sz = (e.size * sizem);
                        that.offscreenContext.globalAlpha = e.opacity;
                        that.offscreenContext.fillStyle = e.color;
                        var x = proj.fromLatLngToContainerPixel(e.latLng).x;
                        var y = proj.fromLatLngToContainerPixel(e.latLng).y;
    
                        that.offscreenContext.beginPath();
                        that.offscreenContext.moveTo(x + sz, y);
                        that.offscreenContext.arc(x, y, sz, 0, sz * Math.PI);
                        that.offscreenContext.closePath();
                        that.offscreenContext.fill();
                        if(e.stroke)
                            that.offscreenContext.stroke();

                    });
                }, 200);

                SVGOverlay.prototype.onDataLoaded = function () {
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
                            0, $('#map').width(), $('#map').width()); 
                        // copy into visual canvas at different position
                        $scope.overlay.context.putImageData(image, 0, 0);
                        $scope.overlay.context.restore();
        
                    })();
                    this.map.addListener('bounds_changed', this.onPan);
                }
                SVGOverlay.prototype.onAdd = function () {


                };

                SVGOverlay.prototype.onPan = function () {
                    var that = this;
                    var proj = this.getProjection();
                    $scope.bounds = this.map.getBounds();

                    var proj = $scope.overlay.getProjection();
                    $scope.overlay.offscreenContext.clearRect(0, 0, $('#map').width(), $('#map').height());
                    $scope.overlay.context.clearRect(0, 0, $('#map').width(), $('#map').height());
                    this.repaint();



                };

                SVGOverlay.prototype.onRemove = function () {
                    this.map.removeListener('bounds_changed', this.onPan);
                    this.canvas.parentNode.removeChild(this.canvas);
                    this.canvas = null;
                };

                SVGOverlay.prototype.draw = function () {
                    
                };

                $scope.map = new google.maps.Map(el, {
                    center: new google.maps.LatLng(35.2253679, -80.8398772),
                    zoom: 14,
                    disableDefaultUI: true,
                    backgroundColor: '#002732',
                });

                fetch('js/map-styles.json')
                    .then((response) => response.json())
                    .then(function (styles) {
                        $scope.map.mapTypes.set('neutral-blue', new google.maps.StyledMapType(styles));
                        $scope.map.setMapTypeId('neutral-blue');
                    });

                $scope.overlay = new SVGOverlay($scope.map);
            }

            d34Service.d3().then(function (d3s) {
                d3 = d3s;
                $timeout(function () {
                    $scope.initMap();
                }, 50)
            });
            $scope.makeid = function () {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for (var i = 0; i < 12; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                return text;
            }
        }]);