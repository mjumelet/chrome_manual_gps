chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        switch (request.type) {
            case 'fakegeo':
                var lat = localStorage['lat'];
                var lng = localStorage['lng'];
                var accuracy = localStorage['accuracy'];
                var isEnabled = !!lat && !!lng && (localStorage['isEnabled'] == 'true');
                if (!isEnabled) {
                    sendResponse({}); // snub them.
                    return;
                }
                sendResponse({'isEnabled': isEnabled, 'lat': parseFloat(lat), 'lng' : parseFloat(lng), 'accuracy': parseFloat(accuracy)});
                break;
            case 'activeChanged':
                var isEnabled = (localStorage['isEnabled'] == 'true');
                chrome.browserAction.setIcon({path: isEnabled ? 'blue_dot_circle.png' : 'gray_dot_circle.png'});
                chrome.windows.getAll({populate: true}, function(windows) {
                    for (var i = 0; i < windows.length; ++i) {
                        var window = windows[i];
                        for (var j = 0; j < window.tabs.length; ++j) {
                            var tab = window.tabs[j];
                            chrome.tabs.sendRequest(tab.id,
                                {'type': 'updateFakeGeo', 'isEnabled': isEnabled,
                                    'lat': localStorage['lat'], 'lng': localStorage['lng'], 'accuracy': localStorage['accuracy']}, null);
                        }
                    }
                });
                break;
        }
    });


