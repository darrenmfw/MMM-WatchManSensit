Module.register("MMM-WatchManSensit", {

    // Default configuration options.
    defaults: {
        updateInterval: 60000,   // Update every 60 seconds.
        serialNumber: "12345678",  // Example serial number.
        password: "Password1!",    // Example password.
        culture: "en",             // Culture/language parameter.
        tankName: "My Tank"        // Display name for your tank.
    },

    start: function() {
        Log.info("Starting MMM-WatchManSensit module...");
        // Initialize the data object.
        this.dataReceived = {
            fillLevel: "N/A",
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

        // Tank Name
        var title = document.createElement("h2");
        title.innerHTML = this.config.tankName;
        wrapper.appendChild(title);

        // Fill level
        var fillDiv = document.createElement("div");
        fillDiv.innerHTML = "Fill level: " + this.dataReceived.fillLevel;
        wrapper.appendChild(fillDiv);

        // Last reading date (timestamp without seconds)
        var lastReadingDiv = document.createElement("div");
        lastReadingDiv.innerHTML = "Last reading: " + this.dataReceived.lastReadingDate;
        wrapper.appendChild(lastReadingDiv);

        // Expected empty date (date only)
        var expectedEmptyDiv = document.createElement("div");
        expectedEmptyDiv.innerHTML = "Expected empty: " + this.dataReceived.runOutDate;
        wrapper.appendChild(expectedEmptyDiv);

        return wrapper;
    }
});
