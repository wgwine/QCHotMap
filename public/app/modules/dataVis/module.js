
angular.module('App.dataVis')
    .controller('dataVisGraphCtrl', ['$scope', '$rootScope', '$window', '$http', '$interval', '$timeout',
        'd34Service',
        function ($scope, $rootScope, $window, $http, $interval, $timeout, d34Service) {

            var svg;


            $scope.colors = ['#FF4E50', '#FC913A', '#F9D423', '#EDE574', '#E1F5C4', '#FF4E50', '#FC913A', '#F9D423'];
            var heatColors = ['#000083',
                '#027ec7',
                '#03bde2',
                '#41ffc1',
                '#d3ff2d',
                '#fda900',
                '#fa1500',
                '#800000'];
            var crashColorScale = d3.scaleOrdinal().range(heatColors);
            for (var i = 1; i < 9; i++) {
                crashColorScale(i);
            }
            var c311 = ['#ffffe0', '#fff2c7', '#ffe4b1', '#ffd69d',
                '#ffc88e', '#ffb981', '#ffaa76', '#ff9a6e', '#fc8968', '#f77a63', '#f16b5f', '#e95d5a',
                '#e14f55', '#d8404e', '#cd3346', '#c2263d', '#b61832', '#a80c25', '#9b0316', '#8b0000', '#fff'];
            var data311ColorScale = d3.scaleOrdinal().range(heatColors.reverse());

            //do this dynamically



            var context;

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
                $scope.overlay.onDataLoaded();

            }
            $scope.processTrafficSignals = function (records) {
                var i = 0;
                records.map(e => {
                    var item = $scope.signalsMap[e.Latitude + "" + e.Longitude];
                    if (item) {
                    } else {
                        var coord = {
                            id: $scope.makeid(),
                            opacity: .6,
                            stroke:'#000',
                            color: "#1F1",
                            size: .3,
                            latLng: new google.maps.LatLng(
                                e.Longitude,
                                e.Latitude
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
                    var item = $scope.predatorMap[e.Latitude + "" + e.Longitude];
                    if (item) {

                    } else {
                        var coord = {
                            id: e.oid,
                            opacity: .5,
                            color: "#F11",
                            stroke:'#fff',
                            size: .3,
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
                    var item = $scope.arrestsMap[e.Latitude + "" + e.Longitude];
                    if (item) {

                    } else {
                        var coord = {
                            id: $scope.makeid(),
                            opacity: 1,
                            color: "#ff8f00",
                            stroke:'#fff',
                            size: .3,
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
                records.map(e => {
                    //if(i<40000)
                    {
                    var item = $scope.crashMap[e.Latitude + "" + e.Longitude];
                    if (item) {
                        if (item.size == 20) {
                            item.opacity += .02;
                        } else {
                            item.size += .07;
                        }
                    } else {
                        var coord = {
                            id: $scope.makeid(),
                            opacity: .15,
                            color: crashColorScale(e.CRSH_LEVL +2),
                            size: .15,
                            latLng: new google.maps.LatLng(
                                e.Latitude,
                                e.Longitude
                            )
                        };
                        $scope.crashMap[e.Latitude + "" + e.Longitude] = coord;
                    }
                }
                    i++;
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
                        if (item.size >= 10) {
                            item.opacity += .01;
                        } else {
                            item.size += .1;
                        }
                    } else {
                        var coord = {
                            id: $scope.makeid(),
                            opacity: .4,
                            color: data311ColorScale(e.TITLE),
                            title:e.TITLE.toLo,
                            size: .1,
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
                    this.svg = null;
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
                $scope.repaint = function(proj){

                }
                SVGOverlay.prototype.onDataLoaded = function () {
                    var proj = this.getProjection();
                    var theDataSelection = d3.select(this.svg)
                        .attr('width', $(window).width()-150)
                        .attr('height', $(window).height() - 5)
                        .selectAll('circle');

                    theDataSelection.data($scope.coords.filter(e=> {
                        return e.latLng.lat() >= $scope.bounds.f.b && 
                        e.latLng.lat() <= $scope.bounds.f.f && 
                        e.latLng.lng() >= $scope.bounds.b.b && 
                        e.latLng.lng() <= $scope.bounds.b.f

                    })).enter().append('circle')
                    .attr('class', 'coords')
                    .attr('stroke-width', function(d) {
                        return 'stroke' in d ? 2 : null;
                    }).attr('stroke-opacity', function(d) {
                        return 'stroke' in d ? .4 : null;
                    }).attr('stroke', function(d) {
                        return 'stroke' in d ? d.stroke : null;
                    })
                        
                    .attr('cx', (d) => proj.fromLatLngToContainerPixel(d.latLng).x)
                    .attr('cy', (d) => proj.fromLatLngToContainerPixel(d.latLng).y)
                    .attr('r', (d) => {
                        return d.size * ($scope.map.getZoom())
                    })   
                    .attr('fill-opacity', (d) => d.opacity)
                    .attr('fill', (d) => d.color);

                    theDataSelection.data($scope.coords.filter(e=> {
                        return e.latLng.lat() >= $scope.bounds.f.b && 
                        e.latLng.lat() <= $scope.bounds.f.f && 
                        e.latLng.lng() >= $scope.bounds.b.b && 
                        e.latLng.lng() <= $scope.bounds.b.f

                    })).exit().remove();

                    this.onPan();
                    document.body.appendChild(this.svg);
                    this.map.addListener('bounds_changed', this.onPan);
                }
                SVGOverlay.prototype.onAdd = function () {
                    var that = this;
                    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    this.svg.style.position = 'absolute';
                    this.svg.style.top = 0;
                    this.svg.style.left = 0;
                    this.svg.style.width = 'calc(100vw - 150px)';
                    this.svg.style.height = 'calc(100vh - 5px);';
                    this.svg.style.pointerEvents = 'none';

                    $scope.bounds = this.map.getBounds();

                };

                SVGOverlay.prototype.onPan = function () {
                    var proj = this.getProjection();
                    $scope.bounds = this.map.getBounds();
                    d3.select(this.svg)
                        .selectAll('circle')
                        .data($scope.coords.filter(e=> {
                            return e.latLng.lat() >= $scope.bounds.f.b && 
                            e.latLng.lat() <= $scope.bounds.f.f && 
                            e.latLng.lng() >= $scope.bounds.b.b && 
                            e.latLng.lng() <= $scope.bounds.b.f
                    }))
                        .attr('cx', (d) => proj.fromLatLngToContainerPixel(d.latLng).x)
                        .attr('cy', (d) => proj.fromLatLngToContainerPixel(d.latLng).y);
                };

                SVGOverlay.prototype.onRemove = function () {
                    this.map.removeListener('bounds_changed', this.onPan);
                    this.svg.parentNode.removeChild(this.svg);
                    this.svg = null;
                };

                SVGOverlay.prototype.draw = function () {
                    
                };

                $scope.map = new google.maps.Map(el, {
                    center: new google.maps.LatLng(35.2253679, -80.8398772),
                    zoom: 14,
                    disableDefaultUI: true,
                    backgroundColor: '#002732'
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