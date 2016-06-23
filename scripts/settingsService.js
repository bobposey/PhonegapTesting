var settingsService = {

    defaults: {
        breakType: 'single',
        endOfLastBreak: 50,
        flightTime: '',
        mealBuffer: 30,
        showMeal: false,
        showWakeup: false,
        takeoffTime: '',
        takeoffToFirstBreak: 20,
        wakeupBuffer: 10
    },

    set: function(key, value) {
        if (typeof value == "undefined" || value == '') {
            return;
        }
        localStorage.setItem(key, value);
    },
    
    get: function(key) {
        var val = localStorage.getItem(key);
        if (val === null) {
            // return the default value if nothing in local storage
            return this.defaults[key];
        }
        return val;
    },

    clear: function() {
        // removes all settings
        localStorage.clear();
    }
    
};