Module.register("MMM-WatchManSensit", {

    // Default configuration options.
    defaults: {
        updateInterval: 60000,       // Update every 60 seconds.
        // Base URL for the Kingspan Connect API endpoints (update if necessary)
        apiBaseUrl: "https://connect.kingspan.com/api",
        username: "YOUR_USERNAME",
        password: "YOUR_PASSWORD"
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        // Initialize data structure for holding the sensor information.
        this.dataReceived = {
            lastReading: "N/A",
            lastReadingDate: "N/A"
        };

        // Request data immediately.
        this.sendSocketNotification("WATCHMAN_DATA_REQUEST", this.config);

        // Set up periodic updates.
        var self = this;
        setInterval(function() {
            self.sendSocketNotification("WATCHMAN_DATA_REQUEST", self.config);
        }, this.config.updateInterval);
    },

    // Process notifications received from the NodeHelper.
    socketNotificationReceived: function(notification, payload) {
        if (notification === "WATCHMAN_DATA_RESPONSE") {
            this.dataReceived = payload;
            this.updateDom();
        } else if (notification === "WATCHMAN_ERROR") {
            Log.error("WatchManSensit error: " + payload);
        }
    },

    // Build the DOM elements to display the sensor information.
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

        return wrapper;
    }
});
