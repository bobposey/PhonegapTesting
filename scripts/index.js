// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints,
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";

    document.addEventListener( 'deviceready', onDeviceReady.bind( this ), false );

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener( 'resume', onResume.bind( this ), false );

        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.


    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
} )();

$(document).ready(function() {
    // are we running in native app or in a browser?
    window.isphone = false;
    if(document.URL.indexOf("http://") === -1
        && document.URL.indexOf("localhost") != 7
        && document.URL.indexOf("https://") === -1) {
        window.isphone = true;
    }

    if( window.isphone ) {
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        onDeviceReady();
    }

    showUtcTime();
    setInterval(showUtcTime, 1000);
});

function onDeviceReady() {
    // do everything here.
}

var startTime, endTime;

var settings = {
    update: function() {
        $('#takeoff-time').inputmask("h:s");
        $('#flight-time').inputmask("h:s");
        $('#takeoff-to-first-break-display').html($('#takeoff-to-first-break-input').val());
        $('#end-of-last-break-display').html($('#end-of-last-break-input').val());
        $('#meal-lead-time-display').html($('#wakeup-buffer-input').val());
        $('#wakeup-buffer-display').html($('#wakeup-buffer-input').val());
        $('#calculate-wakeup-enabled').on('change', function() {
            if ($(this).is(':checked')) {
                $('#calculate-wakeup-options').show();
            } else {
                $('#calculate-wakeup-options').hide();
            }
        });
        $('#calculate-meal-enabled').on('change', function() {
            if ($(this).is(':checked')) {
                $('#calculate-meal-options').show();
            } else {
                $('#calculate-meal-options').hide();
            }
        });

        calculateBreaks();
    }
}

function calculateBreaks() {
    // do the time stuff...
    // we'll only work with the epoch dates to keep things consistent and date free
    var takeoffTime = $('#takeoff-time').val();
    if (!takeoffTime || takeoffTime.indexOf(":") == -1) {
        return clearBreaks();
    }
    var flightTime = $('#flight-time').val();
    if (!flightTime || flightTime.indexOf(":") == -1) {
        return clearBreaks();
    }

    var takeoffTimeArray = takeoffTime.split(':');
    var flightTimeArray = flightTime.split(':');

    startTime = new Date(70, 0, 1, 0, takeoffTimeArray[1], 0, 0);
    endTime = new Date(70, 0, 1, 0, 0, 0, 0);
    startTime.setUTCHours(parseInt(takeoffTimeArray[0]));
    endTime.setUTCHours(parseInt(takeoffTimeArray[0]) + parseInt(flightTimeArray[0]));
    endTime.setUTCMinutes(parseInt(takeoffTimeArray[1]) + parseInt(flightTimeArray[1]));

    showTime('.startTime', startTime);
    showTime('.endTime', endTime);

    var breaksStartTime = new Date(startTime.getTime());
    breaksStartTime.setMinutes(breaksStartTime.getMinutes() + parseInt($('#takeoff-to-first-break-input').val()));

    var breaksEndTime = new Date(endTime.getTime());
    breaksEndTime.setMinutes(breaksEndTime.getMinutes() - parseInt($('#end-of-last-break-input').val()));
    
    showTime('.breaksStartTime', breaksStartTime);
    showTime('.breaksEndTime', breaksEndTime);

    var breakDurationSeconds = breaksEndTime.getTime() - breaksStartTime.getTime();
    var eachBreakDuration = $('#double-augmented-switch').prop('checked') ?
        breakDurationSeconds / 2 :
        breakDurationSeconds / 3;

    $('.breakDuration').html(breakDurationSeconds + ' // ' + breakDurationSeconds / 1000 / 60 + ' minutes');
    $('.eachBreakDuration').html(eachBreakDuration + ' // ' + eachBreakDuration / 1000 / 60 + ' minutes');

    $('#breakResults ons-list-item').remove();
    // first break
    var firstBreakEndTime = new Date(breaksStartTime.getTime());
    firstBreakEndTime.setUTCMilliseconds(eachBreakDuration);
    var secondBreakEndTime = new Date(firstBreakEndTime.getTime());
    secondBreakEndTime.setUTCMilliseconds(eachBreakDuration);
    addBreakEntry(1, getFormattedTime(breaksStartTime), 'n/a', 'n/a', getFormattedTime(firstBreakEndTime));
    addBreakEntry(2, getFormattedTime(firstBreakEndTime), 'n/a', 'n/a', getFormattedTime(secondBreakEndTime));
    if ( ! $('#double-augmented-switch').prop('checked') ) {
        var thirdBreakEndTime = new Date(secondBreakEndTime.getTime());
        thirdBreakEndTime.setUTCMilliseconds(eachBreakDuration);
        addBreakEntry(3, getFormattedTime(secondBreakEndTime), 'n/a', 'n/a', getFormattedTime(thirdBreakEndTime));
    }

}

function clearBreaks() {
    $('.startTime').html('');
    $('.endTime').html('');
}

function addBreakEntry(breakNumber, start, meal, wakeup, end) {
    var html = '<div style="width:20%;float:left;">Break #' + breakNumber + '</div>';
    html += '<div style="width:20%;float:left;">' + start + '</div>';
    html += '<div style="width:20%;float:left;">' + meal + '</div>';
    html += '<div style="width:20%;float:left;"><b>' + wakeup + '</b></div>';
    html += '<div style="width:20%;float:left;">' + end + '</div>';

    $('#breakResults').append("<ons-list-item>" + html + "</ons-list-item>");
//    ons.compile($('#myList')[0]);

}

showUtcTime = function () {
    var now = new Date();
    var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    showTime('.currentUTCTime', now_utc, true);
}

function showTime(target, date, includeSeconds) {
    var timeOutput = getFormattedTime(date, includeSeconds);
    $(target).html(timeOutput);
}

function getFormattedTime(date, includeSeconds) {
    var hour = date.getUTCHours();
    var min = date.getUTCMinutes();
    var sec = date.getUTCSeconds();

    if (hour < 10) {
        hour = "0" + hour;
    }
    if (min < 10) {
        min = "0" + min;
    }

    var timeOutput = hour + ':' + min;
    if (includeSeconds) {
        sec = Math.floor(sec*10/60);
        timeOutput += '.' + sec;
    }
    return timeOutput;
}

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
    cordova.plugins.notification.local.schedule({
        id: 176,
        title: 'Scheduled with delay',
        text: 'Test Message 1',
        at: _5_sec_from_now,
        badge: 12
    });
};

showToast = function (text) {
    setTimeout(function () {
        if (device.platform != 'windows') {
            window.plugins.toast.showShortBottom(text);
        } else {
            showDialog(text);
        }
    }, 100);
};

showDialog = function (text) {
    ons.notification.alert('text');
};
