angular.module('manualGeoApp',['ngMaterial'])
    .controller('manualGeoAppCtrl', function($scope, $document) {

        var marker;
        var circle;
        var map;
        var infowindow;

        $scope.lat = localStorage['lat'] ||  52.3;
        $scope.lng = localStorage['lng'] ||  6.2;
        $scope.accuracy =  parseFloat(localStorage['accuracy']) ||  100;

        function updateUI(isEnabled) {
            removeInfoWindow();
            marker.setVisible(isEnabled);
            circle.setMap(isEnabled ? map : null);
        }

        function setMarkerPosition(lat, lng) {
            var latLng = new google.maps.LatLng(lat, lng);
            if (!marker.getPosition().equals(latLng)) {
                marker.setPosition(latLng);
            }
            marker.setVisible(true);
        }

        function setCirclePosition(lat, lng) {
            var latLng = new google.maps.LatLng(lat, lng);
            if (!circle.getCenter().equals(latLng)) {
                circle.setCenter(latLng);
            }
            circle.setMap(map);
        }

        function setNewPosition(lat, lng) {
            removeInfoWindow();
            localStorage['lat'] = lat;
            localStorage['lng'] = lng;
            localStorage['isEnabled'] = 'true';
            $scope.lat = lat;
            $scope.lng = lng;

            notifyChange();
            if (chrome.browserAction) {
                chrome.browserAction.setIcon({path: 'blue_dot_circle.png'});
            }
        }

        function removeInfoWindow() {
            if (infowindow) {
                infowindow.close();
                infowindow = null;
            }
        }

        function initialize() {
            if (!localStorage['accuracy']) {
                localStorage['accuracy'] = 100;
            }
            if (!localStorage['lat']) {
                localStorage['lat'] = 52.3;
            }
            if (!localStorage['lng']) {
                localStorage['lng'] = 6.2;
            }

            var lat = localStorage['lat'];
            var lng = localStorage['lng'];
            var latlng = new google.maps.LatLng(lat, lng);
            marker = new google.maps.Marker({
                position: latlng,
                title: 'Your manual location',
                draggable: true
            });
            var myOptions = {
                zoom: (parseInt(localStorage['zoom']) || 8),
                center: latlng,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                zoomControl: true,
                disableDoubleClickZoom: true,
                mapTypeId: (localStorage['maptypeid'] || google.maps.MapTypeId.ROADMAP),
                mapTypeControl: true,
                mapTypeControlOptions: {mapTypeIds: [google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID]}
            };
            map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
            marker.setMap(map);
            marker.setVisible(localStorage['isEnabled'] == 'true' && !!lat && !!lng);
            circle = new google.maps.Circle(
                {map: map, center: latlng, radius: localStorage['accuracy'] ? parseFloat(localStorage['accuracy']) : 1000});
            circle.setEditable(true);
            google.maps.event.addListener(map, 'dblclick', function (event) {
                setNewPosition(event.latLng.lat(), event.latLng.lng());
                setMarkerPosition(event.latLng.lat(), event.latLng.lng());
                setCirclePosition(event.latLng.lat(), event.latLng.lng());
                updateUI(true);
                $scope.$apply();
            });
            google.maps.event.addListener(map, 'click', function (event) {
                removeInfoWindow();
                $scope.$apply();
            });
            google.maps.event.addListener(marker, 'dragstart', function (event) {
                removeInfoWindow();
                $scope.$apply();
            });
            google.maps.event.addListener(marker, 'position_changed', function (event) {
                removeInfoWindow();
                setNewPosition(marker.getPosition().lat(), marker.getPosition().lng());
                setCirclePosition(marker.getPosition().lat(), marker.getPosition().lng());
                $scope.$apply();
            });
            google.maps.event.addListener(map, 'zoom_changed', function () {
                localStorage['zoom'] = map.getZoom();
                $scope.$apply();
            });
            google.maps.event.addListener(map, 'maptypeid_changed', function () {
                localStorage['maptypeid'] = String(map.getMapTypeId());
                $scope.$apply();
            });
            google.maps.event.addListener(circle, 'radius_changed', function () {
                localStorage['accuracy'] = circle.getRadius();
                if ($scope.accuracy != circle.getRadius()) {
                    $scope.accuracy = circle.getRadius();
                    notifyChange();
                    $scope.$apply();
                }
            });
            google.maps.event.addListener(marker, 'click', function () {
                var content = '<b>latitude</b>: ' + localStorage['lat'] + "<br/>" +
                    '<b>longitude</b>: ' + localStorage['lng'] + "<br/>" +
                    '<b>accuracy (m):</b> ' + localStorage['accuracy'];
                infowindow = new google.maps.InfoWindow({content: "<h3 style='color:blue'>Your manual location</h3>" + content});
                infowindow.open(map, marker);
                $scope.$apply();
            });
        }

        function notifyChange() {
            if (chrome.extension) {
                chrome.extension.sendRequest({'type': 'activeChanged'});
            }
        }

        $scope.enableChange = function(newValue) {
            console.log('enableChange', newValue);
            localStorage['isEnabled'] = newValue;
            updateUI(newValue);
            notifyChange();
        };

        $scope.changeRadius = function() {
            circle.setRadius($scope.accuracy);
        };

        $scope.changePosition = function() {
            setTimeout(function(){marker.setPosition({lat:parseFloat($scope.lat), lng:parseFloat($scope.lng)})}, 1);
        };

        $scope.moduleEnabled = (localStorage['isEnabled'] == 'true');

        document.addEventListener('mapLibLoaded', function() {
            initialize();
            notifyChange();
        });

        // Check if API key has been set. If not, open options page.
        chrome.storage.sync.get({
            mapsApiKey: 'NOTSET'
        }, function(items) {
            if (items.mapsApiKey !== 'NOTSET') {
                var googleMapsScript = document.createElement('script');
                googleMapsScript.setAttribute('src','https://maps.googleapis.com/maps/api/js?key='
                  + items.mapsApiKey.trim() + '&callback=mapLibHasLoaded');
                document.head.appendChild(googleMapsScript);
            } else {
                chrome.runtime.openOptionsPage();
            }
        });
    });

// Called by google maps script on having finished loading
function mapLibHasLoaded() {
    var mapLibloaded = new Event('mapLibLoaded');
    document.dispatchEvent(mapLibloaded);
}