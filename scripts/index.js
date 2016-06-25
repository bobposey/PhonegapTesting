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
    setInterval(liveTimeUpdate, 1000);
});

function onDeviceReady() {
    // do everything here.
}

var settings = {
    update: function(ele) {

        if (typeof ele !== "undefined") {
            this.calculateMissingFlightTime(ele);
        }
        var offToFirstBreak = $('#off-to-first-break-input').val();
        $('#off-to-first-break-display').html(offToFirstBreak);
        settingsService.set('offToFirstBreak', offToFirstBreak);

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

        settingsService.set('offTime', $('#off-time').val());
        settingsService.set('flightTime', $('#flight-time').val());
        settingsService.set('onTime', $('#on-time').val());
        settingsService.set('breakType', $('#double-augmented-switch').prop('checked') ? 'double': 'single');
        calculateBreaks();
    },

    calculateMissingFlightTime: function(ele) {
        var offTime = $('#off-time').val();
        var flightTime = $('#flight-time').val();
        var onTime = $('#on-time').val();
        var patt = new RegExp('(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]');

        if (ele == 'off') {
            if (!patt.test(offTime)) {
                return;
            }
            if (patt.test(flightTime)) {
                return this.solveMissingFlightTime('on');
            }
            if (patt.test(onTime)) {
                return this.solveMissingFlightTime('flight');
            }
            return;
        }

        if (ele == 'flight') {
            if (!patt.test(flightTime)) {
                return;
            }
            if (patt.test(offTime)) {
                return this.solveMissingFlightTime('on');
            }
            if (patt.test(onTime)) {
                return this.solveMissingFlightTime('off');
            }
            return;
        }

        if (ele == 'on') {
            if (!patt.test(onTime)) {
                return;
            }
            if (patt.test(offTime)) {
                return this.solveMissingFlightTime('flight');
            }
            if (patt.test(flightTime)) {
                return this.solveMissingFlightTime('off');
            }
            return;
        }
    },

    solveMissingFlightTime: function(ele) {
        var offTime = $('#off-time').val();
        var flightTime = $('#flight-time').val();
        var onTime = $('#on-time').val();
        var offTimeArray = offTime.split(':');
        var flightTimeArray = flightTime.split(':');
        var onTimeArray = onTime.split(':');

        switch (ele) {
            case 'off':
                var offTimeDate = new Date( Date.UTC(
                    70,
                    0,
                    1,
                    parseInt(onTimeArray[0]) - parseInt(flightTimeArray[0]),
                    parseInt(onTimeArray[1]) - parseInt(flightTimeArray[1]),
                    0,
                    0
                ));
                $('#off-time').val(getFormattedTime(offTimeDate, false));
                break;
            case 'flight':
                var flightTimeDate = new Date( Date.UTC(
                    70,
                    0,
                    1,
                    parseInt(onTimeArray[0]) - parseInt(offTimeArray[0]),
                    parseInt(onTimeArray[1]) - parseInt(offTimeArray[1]),
                    0,
                    0
                ));
                if (flightTimeDate.getTime() < 0) {
                    flightTimeDate.setTime(flightTimeDate.getTime() + 24 * 60 * 60 * 1000);
                }
                $('#flight-time').val(getFormattedTime(flightTimeDate, false));
                break;
            case 'on':
                var onTimeDate = new Date( Date.UTC(
                    70,
                    0,
                    1,
                    parseInt(offTimeArray[0]) + parseInt(flightTimeArray[0]),
                    parseInt(offTimeArray[1]) + parseInt(flightTimeArray[1]),
                    0,
                    0
                ));
                $('#on-time').val(getFormattedTime(onTimeDate, false));
                break;
        }
    }
};

function calculateBreaks() {
    var showMeal = settingsService.get('showMeal');
    showMeal = showMeal === 'true';
    var showWakeup = settingsService.get('showWakeup');
    showWakeup = showWakeup === 'true';
    var offTime = settingsService.get('offTime');
    var flightTime = settingsService.get('flightTime');
    var offToFirstBreak = settingsService.get('offToFirstBreak');
    var endOfLastBreak = settingsService.get('endOfLastBreak');
    var wakeupBuffer = settingsService.get('wakeupBuffer');
    var mealBuffer = settingsService.get('mealBuffer');
    var breakType = settingsService.get('breakType');

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

    // validation (weak)
    var patt = new RegExp('(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]');
    if (!patt.test(offTime) || !patt.test(flightTime)) {
        return clearBreaks();
    }

    // do the time stuff...
    // we'll only work with the epoch dates to keep things consistent and date free

    var offTimeArray = offTime.split(':');
    var flightTimeArray = flightTime.split(':');

    var startTime = new Date( Date.UTC(70, 0, 1, parseInt(offTimeArray[0]), parseInt(offTimeArray[1]), 0, 0));
    var endTime = new Date( Date.UTC(70, 0, 1, parseInt(offTimeArray[0]) + parseInt(flightTimeArray[0]), parseInt(offTimeArray[1]) + parseInt(flightTimeArray[1]), 0, 0));

    var breaksStartTime = new Date(startTime.getTime());
    breaksStartTime.setMinutes(breaksStartTime.getMinutes() + parseInt(offToFirstBreak));

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

    clearBreaks();

    $('#eachBreakDuration').html(
        '(' +
        Math.floor(eachBreakDuration / 1000 / 60 / 60) + ':' +
        eachBreakDurationMinutes +
        ')'
    );

    // first break
    var currentBreakStartTime = new Date(breaksStartTime.getTime());
    var currentBreakEndTime, currentMealTime, currentWakeupTime;
    var numberBreaks = (breakType == 'double') ? 2 : 3;
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
    $('#eachBreakDuration').html('');
    $('#breakResults ons-list-item').remove();
}

function addBreakEntry(breakNumber, start, meal, wakeup, end) {

    var showMeal = settingsService.get('showMeal');
    var showWakeup = settingsService.get('showWakeup');
    showMeal = showMeal === "true";
    showWakeup = showWakeup === "true";
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

liveTimeUpdate = function() {
    showUtcTime();
    showRemainingTime();
}

showUtcTime = function () {
    var now = new Date();
    var now_utc = new Date( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    showTime('.currentUTCTime', now_utc, true);
};

showRemainingTime = function() {
    var onTime = $('#on-time').val();
    var patt = new RegExp('(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]');
    if (patt.test(onTime)) {
        var now = new Date();
        var now_utc = new Date( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
        var onTimeArray = onTime.split(':');
        var onTimeDate = new Date( Date.UTC(70, 0, 1, parseInt(onTimeArray[0]), parseInt(onTimeArray[1]), 0, 0));
        var remainingDate = new Date(onTimeDate.getTime() - now_utc.getTime());
        if (remainingDate.getTime < 0) {
            remainingDate = new Date(remainingDate.getTime + 24 * 60 * 60 * 1000);
        }
        showTime('.remainingFlightTime', remainingDate, false);
    }
}

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
//        sec = Math.floor(sec*10/60);
        if (sec < 10) {
            sec = "0" + sec;
        }
        timeOutput += ':' + sec;
    }
    return timeOutput;
};

function resetFlightTimes() {

    ons.notification.confirm({
        message: 'Do you want to reset the flight times?',
        // or messageHTML: '<div>Message in HTML</div>',
        title: 'Reset Flight Times',
        buttonLabels: ['Reset', 'Cancel'],
        animation: 'default', // or 'none'
        primaryButtonIndex: 1,
        cancelable: true,
        callback: function(index) {
            // -1: Cancel
            // 0-: Button index from the left
            if (index === 0) {
                $('#off-time').val('');
                $('#flight-time').val('');
                $('#on-time').val('');
                clearBreaks();
                settingsService.remove('offTime');
                settingsService.remove('flightTime');
                settingsService.remove('onTime');
            }
        }
    });
}

document.addEventListener("init", function(event) {
    var page = event.target.id;
    if (page == 'breaks.html') {
        $('#off-time').inputmask("h:s");
        $('#flight-time').inputmask("h:s");
        $('#on-time').inputmask("h:s");
        // load settings
        var offToFirstBreak = settingsService.get('offToFirstBreak');
        $('#off-to-first-break-input').val(offToFirstBreak);
        $('#off-to-first-break-display').html(offToFirstBreak);

        var endOfLastBreak = settingsService.get('endOfLastBreak')
        $('#end-of-last-break-input').val(endOfLastBreak);
        $('#end-of-last-break-display').html(endOfLastBreak);

        $('#off-time').val(settingsService.get('offTime'));
        $('#flight-time').val(settingsService.get('flightTime'));
        $('#on-time').val(settingsService.get('onTime'));

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