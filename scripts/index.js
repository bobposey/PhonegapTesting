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

var startTime, endTime, showMeal, mealBuffer = 30, showWakeup, wakeupBuffer = 10;

var settings = {
    update: function() {
        $('#takeoff-time').inputmask("h:s");
        $('#flight-time').inputmask("h:s");
        $('#takeoff-to-first-break-display').html($('#takeoff-to-first-break-input').val());
        $('#end-of-last-break-display').html($('#end-of-last-break-input').val());
        $('#meal-lead-time-display').html($('#meal-lead-time-input').val());
        if ($('#meal-lead-time-input').val()) {
            mealBuffer = parseInt($('#meal-lead-time-input').val());
        }
        $('#wakeup-buffer-display').html($('#wakeup-buffer-input').val());
        if ($('#wakeup-buffer-input').val()) {
            wakeupBuffer = parseInt($('#wakeup-buffer-input').val());
        }
        $('#calculate-wakeup-enabled').on('change', function() {
            if ($(this).is(':checked')) {
                $('#calculate-wakeup-options').show();
                showWakeup = true;
            } else {
                $('#calculate-wakeup-options').hide();
                showWakeup = false;
            }
        });
        $('#calculate-meal-enabled').on('change', function() {
            if ($(this).is(':checked')) {
                $('#calculate-meal-options').show();
                showMeal = true;
            } else {
                $('#calculate-meal-options').hide();
                showMeal = false;
            }
        });

        calculateBreaks();
    }
}

function calculateBreaks() {
    showMeal ?  $('.showMeal').show() : $('.showMeal').hide();
    showWakeup ?  $('.showWakeup').show() : $('.showWakeup').hide();
    var columns = 5;
    if (!showMeal) {
        columns--;
    }
    if (!showWakeup) {
        columns--;
    }
    var width = Math.round(100/columns, 4);
    $('.breaksHeader').css('width', width + '%');

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

    var breaksStartTime = new Date(startTime.getTime());
    breaksStartTime.setMinutes(breaksStartTime.getMinutes() + parseInt($('#takeoff-to-first-break-input').val()));

    var breaksEndTime = new Date(endTime.getTime());
    breaksEndTime.setMinutes(breaksEndTime.getMinutes() - parseInt($('#end-of-last-break-input').val()));
    
    var breakDurationSeconds = breaksEndTime.getTime() - breaksStartTime.getTime();
    var eachBreakDuration = $('#double-augmented-switch').prop('checked') ?
        breakDurationSeconds / 2 :
        breakDurationSeconds / 3;

    var eachBreakDurationMinutes = Math.floor(eachBreakDuration/(60*1000)) % 60;
    if (eachBreakDurationMinutes < 10) {
        eachBreakDurationMinutes = "0" + eachBreakDurationMinutes;
    }

    $('#eachBreakDuration').html(
        '(' +
        Math.floor(eachBreakDuration / 1000 / 60 / 60) + ':' +
        eachBreakDurationMinutes +
        ')'
    );

    $('#breakResults ons-list-item').remove();
    // first break
    var currentBreakStartTime = new Date(breaksStartTime.getTime());
    var currentBreakEndTime, currentMealTime, currentWakeupTime;
    var numberBreaks = $('#double-augmented-switch').prop('checked') ? 2 : 3;
    var mealLeadTime = mealBuffer * 60 * 1000;
    var wakeupLeadTime = wakeupBuffer * 60 * 1000;
    for (var $i=1; $i <= numberBreaks; $i++) {
        currentBreakEndTime = new Date(currentBreakStartTime.getTime() + eachBreakDuration);
        currentMealTime = new Date(currentBreakEndTime - mealLeadTime);
        currentWakeupTime = new Date(currentBreakEndTime - wakeupLeadTime);
        addBreakEntry(
            'Break #' + $i,
            getFormattedTime(currentBreakStartTime),
            getFormattedTime(currentMealTime),
            getFormattedTime(currentWakeupTime),
            getFormattedTime(currentBreakEndTime)
        );
        currentBreakStartTime = new Date(currentBreakEndTime.getTime());
    }
    addBreakEntry('Land', getFormattedTime(endTime), ' ', ' ', ' ');
}

function clearBreaks() {
    $('.startTime').html('');
    $('.endTime').html('');
}

function addBreakEntry(breakNumber, start, meal, wakeup, end) {

    var columns = 5;
    if (!showMeal) {
        columns--;
    }
    if (!showWakeup) {
        columns--;
    }
    var width = Math.round(100/columns, 4);
    var html = '<div style="width:' + width + '%;float:left;">' + breakNumber + '</div>';
    html += '<div style="width:' + width + '%;float:left;">' + start + '</div>';
    if (showMeal) {
        html += '<div style="width:' + width + '%;float:left;">' + meal + '</div>';
    }
    if (showWakeup) {
        html += '<div style="width:' + width + '%;float:left;"><b>' + wakeup + '</b></div>';
    }
    html += '<div style="width:' + width + '%;float:left;">' + end + '</div>';

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
//    var sound = device.platform == 'Android' ? 'file://sound.mp3' : 'file://beep.caf';
    ons.notification.alert('trying to set notification now...');
    cordova.plugins.notification.local.schedule({
        // id: 17612390,
        title: 'Scheduled with delay',
        message: 'Test Message 1',
        // at: _5_sec_from_now,
        // badge: 12
    });
    // Join BBM Meeting when user has clicked on the notification
    cordova.plugins.notification.local.on("click", function (notification) {
       ons.notification.alert('Wake Up!');
    });
};

showToast = function (text) {
    ons.notification.alert(text);
};
