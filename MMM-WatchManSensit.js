Module.register("MMM-WatchManSensit", {

    // Default configuration options.
    defaults: {
        updateInterval: 60000, // Update every 60 seconds.
        serialNumber: "12345678",  // Example serial number.
        password: "Password1!",    // Example password.
        culture: "en"              // Culture/language parameter.
    },

    start: function() {
        Log.info("Starting MMM-WatchManSensit module...");
        // Initialize the data object with a new runOutDate field.
        this.dataReceived = {
            lastReading: "N/A",
            lastReadingDate: "N/A",
            runOutDate: "N/A"
        };
        // Request data immediately.
        this.sendSocketNotification("WATCHMAN_DATA_REQUEST", this.config);
        // Schedule periodic updates.
        var self = this;
        setInterval(function() {
            self.sendSocketNotification("WATCHMAN_DATA_REQUEST", self.config);
        }, this.config.updateInterval);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "WATCHMAN_DATA_RESPONSE") {
            this.dataReceived = payload;
            this.updateDom();
        } else if (notification === "WATCHMAN_ERROR") {
            Log.error("WATCHMAN_ERROR: " + payload);
        }
    },

    getDom: function() {
        var wrapper = document.createElement("div");

        var title = document.createElement("h2");
        title.innerHTML = "WatchMan SENSiT";
        wrapper.appendChild(title);

        var readingDiv = document.createElement("div");
        readingDiv.innerHTML = "Last Reading: " + this.dataReceived.lastReading;
        wrapper.appendChild(readingDiv);

        var dateDiv = document.createElement("div");
        dateDiv.innerHTML = "Last Reading Date: " + this.dataReceived.lastReadingDate;
        wrapper.appendChild(dateDiv);

        var runOutDiv = document.createElement("div");
        runOutDiv.innerHTML = "Run Out Date: " + this.dataReceived.runOutDate;
        wrapper.appendChild(runOutDiv);

        return wrapper;
    }
});
