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

var settings = {
    update: function() {
        // $('#takeoff-time').inputmask("h:s");
        // $('#flight-time').inputmask("h:s");

        var takeoffToFirstBreak = $('#takeoff-to-first-break-input').val();
        $('#takeoff-to-first-break-display').html(takeoffToFirstBreak);
        settingsService.set('takeoffToFirstBreak', takeoffToFirstBreak);

        var endOfLastBreak = $('#end-of-last-break-input').val();
        $('#end-of-last-break-display').html(endOfLastBreak);
        settingsService.set('endOfLastBreak', endOfLastBreak);

        var mealBuffer= $('#meal-lead-time-input').val();
        $('#meal-lead-time-display').html(mealBuffer);

        if ($('#meal-lead-time-input').val()) {
            mealBuffer = parseInt(mealBuffer);
            settingsService.set('mealBuffer', mealBuffer)
        }

        var wakeupBuffer = $('#wakeup-buffer-input').val();
        $('#wakeup-buffer-display').html(wakeupBuffer);
        if (wakeupBuffer) {
            wakeupBuffer = parseInt($('#wakeup-buffer-input').val());
            settingsService.set('wakeupBuffer', wakeupBuffer);
        }

        $('#calculate-wakeup-enabled').on('change', function() {
            if ($(this).is(':checked')) {
                $('#calculate-wakeup-options').show();
                showWakeup = true;
            } else {
                $('#calculate-wakeup-options').hide();
                showWakeup = false;
            }
            settingsService.set('showWakeup', showWakeup);
        });
        
        $('#calculate-meal-enabled').on('change', function() {
            if ($(this).is(':checked')) {
                $('#calculate-meal-options').show();
                showMeal = true;
            } else {
                $('#calculate-meal-options').hide();
                showMeal = false;
            }
            settingsService.set('showMeal', showMeal);
        });

        settingsService.set('takeoffTime', $('#takeoff-time').val());
        settingsService.set('flightTime', $('#flight-time').val());
        settingsService.set('breakType', $('#double-augmented-switch').prop('checked') ? 'double': 'single');
        calculateBreaks();
    }
};

function calculateBreaks() {
    var showMeal = settingsService.get('showMeal');
    var showWakeup = settingsService.get('showWakeup');
    var takeoffTime = settingsService.get('takeoffTime');
    var flightTime = settingsService.get('flightTime');
    var takeoffToFirstBreak = settingsService.get('takeoffToFirstBreak');
    var endOfLastBreak = settingsService.get('endOfLastBreak');
    var wakeupBuffer = settingsService.get('wakeupBuffer');
    var mealBuffer = settingsService.get('mealBuffer');
    var breakType = settingsService.get('breakType');

    (showMeal == 'true') ?  $('.showMeal').show() : $('.showMeal').hide();
    (showWakeup == 'true') ?  $('.showWakeup').show() : $('.showWakeup').hide();

    var columns = 5;
    if (!showMeal) {
        columns--;
    }
    if (!showWakeup) {
        columns--;
    }
    var width = Math.round(100/columns, 4);
    $('.breaksHeader').css('width', width + '%');

    // validation (weak)
    var patt = new RegExp('(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]');
    if (!patt.test(takeoffTime) || !patt.test(flightTime)) {
        return clearBreaks();
    }

    // do the time stuff...
    // we'll only work with the epoch dates to keep things consistent and date free

    var takeoffTimeArray = takeoffTime.split(':');
    var flightTimeArray = flightTime.split(':');

    startTime = new Date(70, 0, 1, 0, takeoffTimeArray[1], 0, 0);
    endTime = new Date(70, 0, 1, 0, 0, 0, 0);
    startTime.setUTCHours(parseInt(takeoffTimeArray[0]));
    endTime.setUTCHours(parseInt(takeoffTimeArray[0]) + parseInt(flightTimeArray[0]));
    endTime.setUTCMinutes(parseInt(takeoffTimeArray[1]) + parseInt(flightTimeArray[1]));

    var breaksStartTime = new Date(startTime.getTime());
    breaksStartTime.setMinutes(breaksStartTime.getMinutes() + parseInt(takeoffToFirstBreak));

    var breaksEndTime = new Date(endTime.getTime());
    breaksEndTime.setMinutes(breaksEndTime.getMinutes() - parseInt(endOfLastBreak));
    
    var breakDurationSeconds = breaksEndTime.getTime() - breaksStartTime.getTime();

    var eachBreakDuration = (breakType == 'double')  ?
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

    clearBreaks();
    // first break
    var currentBreakStartTime = new Date(breaksStartTime.getTime());
    var currentBreakEndTime, currentMealTime, currentWakeupTime;
    var numberBreaks = (breakType == 'single') ? 2 : 3;
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
    $('#breakResults ons-list-item').remove();

}

function addBreakEntry(breakNumber, start, meal, wakeup, end) {

    var showMeal = settingsService.get('showMeal');
    var showWakeup = settingsService.get('showMeal');

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
};

function showTime(target, date, includeSeconds) {
    var timeOutput = getFormattedTime(date, includeSeconds);
    $(target).html(timeOutput);
};

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
};



document.addEventListener("init", function(event) {
    var page = event.target.id;
    if (page == 'breaks.html') {
        $('#takeoff-time').inputmask("h:s");
        $('#flight-time').inputmask("h:s");
        // load settings
        var takeoffToFirstBreak = settingsService.get('takeoffToFirstBreak');
        $('#takeoff-to-first-break-input').val(takeoffToFirstBreak);
        $('#takeoff-to-first-break-display').html(takeoffToFirstBreak);

        var endOfLastBreak = settingsService.get('endOfLastBreak')
        $('#end-of-last-break-input').val(endOfLastBreak);
        $('#end-of-last-break-display').html(endOfLastBreak);

        $('#takeoff-time').val(settingsService.get('takeoffTime'));
        $('#flight-time').val(settingsService.get('flightTime'));

        var breakType = settingsService.get('breakType');
        if (breakType == 'single') {
            $('#double-augmented-switch')[0].checked = false;
        } else {
            $('#double-augmented-switch')[0].checked = true;
        }
        showUtcTime();
        calculateBreaks();
    }


    if (page == "settings.html") {
        // calculate wakeup time
        var showWakeup = settingsService.get('showWakeup');
        if (showWakeup == "true") {
            $('#calculate-wakeup-enabled')[0].checked = true;
            $('#calculate-wakeup-options').show();
        } else {
            $('#calculate-wakeup-enabled')[0].checked = false;
            $('#calculate-wakeup-options').hide();
        }
        var wakeupBuffer = settingsService.get('wakeupBuffer');
        $('#wakeup-buffer-input').val(wakeupBuffer);
        $('#wakeup-buffer-display').html(wakeupBuffer);

        // calculate crew meal time
        var showMeal = settingsService.get('showMeal');
        if (showMeal == "true") {
            $('#calculate-meal-enabled')[0].checked = true;
            $('#calculate-meal-options').show();
        } else {
            $('#calculate-meal-enabled')[0].checked = false;
            $('#calculate-meal-options').hide();
        }
        var mealBuffer = settingsService.get('mealBuffer');
        $('#meal-lead-time-input').val(mealBuffer);
        $('#meal-lead-time-display').html(mealBuffer);

        showUtcTime();
        // show FAR 117 legalities
    }
}, false);