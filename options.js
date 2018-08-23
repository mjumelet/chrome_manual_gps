function save_options() {
    var mapsApiKey = document.getElementById('api').value;
    console.log(mapsApiKey);
    chrome.storage.sync.set({
        mapsApiKey: mapsApiKey
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

function restore_options() {
    // Use default value 'NOTSET' if no value stored
    chrome.storage.sync.get({
        mapsApiKey: 'NOTSET'
    }, function(items) {
        document.getElementById('api').value = items.mapsApiKey;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
  save_options);