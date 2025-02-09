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

        // Define inline styles for labels and information.
        var labelStyle = "color: grey; margin-right: 5px;";
        var infoStyle = "color: white;";

        // Create a container div for each line.

        // Tank Name
        var tankDiv = document.createElement("div");
        var tankLabel = document.createElement("span");
        tankLabel.innerHTML = "Tank: ";
        tankLabel.style.cssText = labelStyle;
        var tankInfo = document.createElement("span");
        tankInfo.innerHTML = this.config.tankName;
        tankInfo.style.cssText = infoStyle;
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
        fillInfo.style.cssText = infoStyle;
        fillDiv.appendChild(fillLabel);
        fillDiv.appendChild(fillInfo);
        wrapper.appendChild(fillDiv);

        // Last Reading Date (labeled "Last reading:")
        var lastDiv = document.createElement("div");
        var lastLabel = document.createElement("span");
        lastLabel.innerHTML = "Last reading: ";
        lastLabel.style.cssText = labelStyle;
        var lastInfo = document.createElement("span");
        lastInfo.innerHTML = this.dataReceived.lastReadingDate;
        lastInfo.style.cssText = infoStyle;
        lastDiv.appendChild(lastLabel);
        lastDiv.appendChild(lastInfo);
        wrapper.appendChild(lastDiv);

        // Run Out Date (labeled "Expected empty:")
        var expectedDiv = document.createElement("div");
        var expectedLabel = document.createElement("span");
        expectedLabel.innerHTML = "Expected empty: ";
        expectedLabel.style.cssText = labelStyle;
        var expectedInfo = document.createElement("span");
        expectedInfo.innerHTML = this.dataReceived.runOutDate;
        expectedInfo.style.cssText = infoStyle;
        expectedDiv.appendChild(expectedLabel);
        expectedDiv.appendChild(expectedInfo);
        wrapper.appendChild(expectedDiv);

        return wrapper;
    }
});
