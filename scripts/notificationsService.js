<!--   LOCAL NOTIFICATION HELPER FUNCTIONS -->

hasPermission = function () {
    cordova.plugins.notification.local.hasPermission(function (granted) {
        showToast('Granted: ' + granted ? 'Yes' : 'No');
    });
};

registerPermission = function () {
    cordova.plugins.notification.local.registerPermission(function (granted) {
        showToast('Registered: ' + granted ? 'Yes' : 'No');
    });
};

scheduleDelayed = function (x) {
    var now = new Date().getTime(),
        _sec_from_now = new Date(now + parseInt(x) * 1000);
    var sound = device.platform == 'Android' ? 'file://sound.mp3' : 'file://beep.caf';
    showToast('Set notification for ' + x + 'seconds from now...');
    cordova.plugins.notification.local.schedule({
        id: 17,
        title: 'Time To Get Up!',
        message: 'Crew Change at 10:11Z',
        at: _sec_from_now,
        sound: sound,
        badge: 12
    });
};

allNotifications = function () {
    cordova.plugins.notification.local.getAll(function (notifications) {
        showToast('<b>Notifications:</b><br>' + JSON.stringify(notifications));
    });
}

clearAllNotifications = function() {
    cordova.plugins.notification.local.clearAll(function() {
        showToast('Notifications Cleared')
    });
}

showToast = function (text) {
    $('.debug-pane').append('<div>'+text+'</div>');
};
