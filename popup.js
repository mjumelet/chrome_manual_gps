var marker;
var circle;
var map;
var infowindow;
var placeService;
var geocoder;

function updateUI(isEnabled) {
  removeInfoWindow();
  marker.setVisible(isEnabled);
  circle.setMap(isEnabled ? map : null);
  $('#toggleSpan').text(isEnabled ? 'disable' :'enable');
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
  notifyChange();
  chrome.browserAction.setIcon({path: 'blue_dot_circle.png'});
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
    localStorage['lat'] = 40.8;
  }
  if (!localStorage['lng']) {
    localStorage['lng'] = -74.00528;
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
  map = new google.maps.Map(document.getElementById("map_canvas"),
      myOptions);
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
  });
  google.maps.event.addListener(map, 'click', function (event) {
    removeInfoWindow();
  });
  google.maps.event.addListener(marker, 'dragstart', function (event) {
    removeInfoWindow();
  });
  google.maps.event.addListener(marker, 'position_changed', function (event) {
    removeInfoWindow();
    setNewPosition(marker.getPosition().lat(), marker.getPosition().lng());
    setCirclePosition(marker.getPosition().lat(), marker.getPosition().lng());
  });
  google.maps.event.addListener(map, 'zoom_changed', function () {
    localStorage['zoom'] = map.getZoom();
  });
  google.maps.event.addListener(map, 'maptypeid_changed', function () {
    localStorage['maptypeid'] = String(map.getMapTypeId());
  });
  google.maps.event.addListener(circle, 'radius_changed', function () {
    localStorage['accuracy'] = circle.getRadius();
    notifyChange();
  });
  google.maps.event.addListener(circle, 'center_changed', function () {
    setNewPosition(circle.getCenter().lat(), circle.getCenter().lng());
    setMarkerPosition(circle.getCenter().lat(), circle.getCenter().lng());
  });
  google.maps.event.addListener(marker, 'click', function () {
    var content = '<b>latitude</b>: ' + localStorage['lat'] + "<br/>" +
        '<b>longitude</b>: ' + localStorage['lng'] + "<br/>" +
        '<b>accuracy (m):</b> ' + localStorage['accuracy'];
    infowindow = new google.maps.InfoWindow({content: "<h3 style='color:blue'>Your manual location</h3>" + content});
    infowindow.open(map, marker);
  });

  updateUI(localStorage['isEnabled'] == 'true');
}

function toggle() {
  var nowEnabled = !(localStorage['isEnabled'] == 'true');
  localStorage['isEnabled'] = nowEnabled;
  updateUI(nowEnabled, localStorage['lat'], localStorage['lng']);
  notifyChange();
}

function validateDigit(evt) {
  var theEvent = evt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode( key );
  var regex = /^[0-9]*\.?[0-9]*$/;
  if( !regex.test(evt.target.value + key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}

function setAccuracy(evt) {
  var value = parseFloat(evt.target.value);
  if (value && value != NaN && value > 0.0) {
    localStorage['accuracy'] = value;
    evt.target.style.background = 'white';
    if (circle) {

    }
  } else {
    evt.target.style.background = 'red';
  }
}

function notifyChange() {
  chrome.extension.sendRequest({'type': 'activeChanged'});
}

$(document).ready(function(){
  initialize();

  notifyChange();

  $('#toggle').click(toggle);
});