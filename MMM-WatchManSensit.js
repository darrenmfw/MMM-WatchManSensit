Module.register("MMM-WatchManSensit", {

    // Default configuration options.
    defaults: {
        updateInterval: 3600000,   // Update every 1 hour.
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
            runOutDate: "N/A",
            rawRunOutDate: "N/A"
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

        // Define inline styles for labels and default info.
        var labelStyle = "color: grey; margin-right: 5px;";
        var defaultInfoStyle = "color: white;";

        // Tank Name
        var tankDiv = document.createElement("div");
        var tankLabel = document.createElement("span");
        tankLabel.innerHTML = "Tank: ";
        tankLabel.style.cssText = labelStyle;
        var tankInfo = document.createElement("span");
        tankInfo.innerHTML = this.config.tankName;
        tankInfo.style.cssText = defaultInfoStyle;
        tankDiv.appendChild(tankLabel);
        tankDiv.appendChild(tankInfo);
        wrapper.appendChild(tankDiv);

        // Fill Level
        var fillDiv = document.createElement("div");
        var fillLabel = document.createElement("span");
        fillLabel.innerHTML = "Fill level: ";
        fillLabel.style.cssText = labelStyle;
        var fillInfo = document.createElement("span");
        fillInfo.innerHTML = this.dataReceived.fillLevel;
        fillInfo.style.cssText = defaultInfoStyle;
        fillDiv.appendChild(fillLabel);
        fillDiv.appendChild(fillInfo);
        wrapper.appendChild(fillDiv);

        // Last Reading (labeled "Last reading:")
        var lastDiv = document.createElement("div");
        var lastLabel = document.createElement("span");
        lastLabel.innerHTML = "Last reading: ";
        lastLabel.style.cssText = labelStyle;
        var lastInfo = document.createElement("span");
        lastInfo.innerHTML = this.dataReceived.lastReadingDate;
        // Set last reading red if it is more than 48 hours old.
        var lastReadingStyle = defaultInfoStyle;
        if (this.dataReceived.lastReadingDate && this.dataReceived.lastReadingDate !== "N/A") {
            var readingDateObj = new Date(this.dataReceived.lastReadingDate);
            var now = new Date();
            if ((now - readingDateObj) > 48 * 3600 * 1000) {
                lastReadingStyle = "color: red;";
            }
        }
        lastInfo.style.cssText = lastReadingStyle;
        lastDiv.appendChild(lastLabel);
        lastDiv.appendChild(lastInfo);
        wrapper.appendChild(lastDiv);

        // Expected empty (labeled "Expected empty:")
        var expectedDiv = document.createElement("div");
        var expectedLabel = document.createElement("span");
        expectedLabel.innerHTML = "Expected empty: ";
        expectedLabel.style.cssText = labelStyle;
        var expectedInfo = document.createElement("span");
        expectedInfo.innerHTML = this.dataReceived.runOutDate;
        // Use the raw runOutDate for comparison.
        var expectedEmptyStyle = defaultInfoStyle;
        if (this.dataReceived.rawRunOutDate && this.dataReceived.rawRunOutDate !== "N/A") {
            var runOutDateObj = new Date(this.dataReceived.rawRunOutDate);
            var now = new Date();
            // If the run out date is within 4 weeks from now, mark it red.
            if ((runOutDateObj - now) <= 4 * 7 * 24 * 3600 * 1000) {
                expectedEmptyStyle = "color: red;";
            }
        }
        expectedInfo.style.cssText = expectedEmptyStyle;
        expectedDiv.appendChild(expectedLabel);
        expectedDiv.appendChild(expectedInfo);
        wrapper.appendChild(expectedDiv);

        return wrapper;
    }
});
