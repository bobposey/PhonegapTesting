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
        $('#takeoff-time').inputmask("h:s");
        $('#flight-time').inputmask("h:s");

    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
} )();

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

    }
    
}