function installFakeGeolocationCode() {
  var timerId = null;
  if (!navigator.geolocation) {
    return;
  }
  navigator.geolocation.getCurrentPosition_ = navigator.geolocation.getCurrentPosition;
  navigator.geolocation.watchPosition_ = navigator.geolocation.watchPosition;
  navigator.geolocation.clearWatch_ = navigator.geolocation.clearWatch;

  navigator.geolocation.clearWatch = function (id) {
    window.clearInterval(id);
  };

  function sendBackResponse (successCb, errorCb, options, jsonedResponse) {
    var response = JSON.parse(jsonedResponse);
    if (response.isEnabled) {
      successCb({ 'coords': { 'latitude': response.lat, 'longitude': response.lng,
        'accuracy': response.accuracy }, 'timestamp': new Date().getTime() });
    } else {
      navigator.geolocation.getCurrentPosition_(successCb, errorCb, options);
    }
  }

  function createGetFakePosition(successCb, errorCb, options) {
    return function () {
      var positionElement = document.getElementById('fake_position_meta');
      if (!positionElement) {
        var interval = setInterval(function() {
          positionElement = document.getElementById('fake_position_meta');
          if (positionElement) {
            clearInterval(interval);
            sendBackResponse(successCb, errorCb, options, positionElement.getAttribute('content'));
          }
        }, 200 /* ms */);
      } else {
        // we already have the div, no need for intervals etc.
        sendBackResponse(successCb, errorCb, options, positionElement.getAttribute('content'));
      }
    };
  };

  navigator.geolocation.getCurrentPosition = function (cb1, cb2, options) {
    var getFakePosition = createGetFakePosition(cb1, cb2, options);
    getFakePosition();
  };

  navigator.geolocation.watchPosition = function (cb1, cb2, options) {
    var getFakePosition = createGetFakePosition(cb1, cb2, options);
    getFakePosition();
    if (timerId) {
      window.clearInterval(timerId);
    }
    timerId = window.setInterval(getFakePosition, 5 * 1000);
    return timerId;
  };
}


function insertFakeMetaElement(response) {
  var positionElement = document.getElementById('fake_position_meta');
  if (!positionElement) {
    positionElement = document.createElement('meta');
    positionElement.id = 'fake_position_meta';
    positionElement.setAttribute('name', 'fake_geolocation_chrome_extension');
    (document.body || document.documentElement).appendChild(positionElement);
  }
  positionElement.setAttribute('content', JSON.stringify(response));
}

/* main code */
if (document.documentElement.tagName.toLowerCase() == 'html') {  // Skip non-html pages.
	var script = document.createElement('script');
	script.appendChild(document.createTextNode('('+ installFakeGeolocationCode +')();'));
	var parent = (document.head || document.body || document.documentElement);
	var firstChild = (parent.childNodes && (parent.childNodes.length > 0)) ? parent.childNodes[0] : null;
	if (firstChild) {
	  parent.insertBefore(script, firstChild);
	} else {
	  parent.appendChild(script);
	}

	chrome.extension.sendRequest({type: "fakegeo"}, function(response) {
	  insertFakeMetaElement(response);
	});

	chrome.extension.onRequest.addListener(function(request, send, response) {
	  if (!request.type || request.type != 'updateFakeGeo') {
	    return;
	  }
	  insertFakeMetaElement(request);
	});
}
