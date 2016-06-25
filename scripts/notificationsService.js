<!--   LOCAL NOTIFICATION HELPER FUNCTIONS -->

hasPermission = function () {
    cordova.plugins.notification.local.hasPermission(function (granted) {
        showToast(granted ? 'Yes' : 'No');
    });
};

registerPermission = function () {
    cordova.plugins.notification.local.registerPermission(function (granted) {
        showToast(granted ? 'Yes' : 'No');
    });
};

scheduleDelayed = function () {
    var now = new Date().getTime(),
        _5_sec_from_now = new Date(now + 5 * 1000);
    var sound = device.platform == 'Android' ? 'file://sound.mp3' : 'file://beep.caf';
    ons.notification.alert('trying to set notification now...');
    cordova.plugins.notification.local.schedule({
        id: 17,
        title: 'Time To Get Up!',
        message: 'Crew Change at 10:11Z',
        at: _5_sec_from_now,
        sound: sound
        // badge: 12
    });
};

allNotifications = function () {
    cordova.plugins.notification.local.getAll(function (notifications) {
        console.log(notifications);
        showToast('<b>Notifications:</b><br>' + JSON.stringify(notifications));
    });
}

showToast = function (text) {
    $('.debug-pane').append('<div>'+text+'</div>');
};
