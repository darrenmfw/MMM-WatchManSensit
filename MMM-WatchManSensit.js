Module.register("MMM-WatchManSensit", {

    // Default configuration options.
    defaults: {
        updateInterval: 3600000,   // Update every 1 hour.
        serialNumber: "12345678",  // Example serial number (for backward compatibility; not used when using multi-tank configuration).
        password: "Password1!",    // Example password.
        culture: "en",             // Culture/language parameter.
        // For multi-tank support, provide an array of tank configurations.
        // Each tank should have a serialNumber and a tankName.
        tanks: [
            {
                serialNumber: "12345678",
                tankName: "Main Tank"
            },
            {
                serialNumber: "87654321",
                tankName: "Secondary Tank"
            },
            {
                serialNumber: "11223344",
                tankName: "Tertiary Tank"
            }
        ]
    },

    start: function() {
        Log.info("Starting MMM-WatchManSensit module...");
        // Initialize the data object as an array.
        this.dataReceived = [];
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
        // If no tank data is received, don't display anything.
        if (!this.dataReceived || this.dataReceived.length === 0) {
            return wrapper;
        }
        
        // Define inline styles for labels and info.
        var labelStyle = "color: grey; margin-right: 5px;";
        var defaultInfoStyle = "color: white;";
        
        // Iterate over each tank and create a block.
        this.dataReceived.forEach(function(tank) {
            // If there's no valid data for a tank, skip it.
            if (!tank.fillLevel || tank.fillLevel === "N/A") {
                return;
            }
            
            var tankWrapper = document.createElement("div");
            tankWrapper.style.marginBottom = "10px";
            tankWrapper.style.paddingBottom = "5px";
            tankWrapper.style.borderBottom = "1px solid grey";
            
            // Tank Name
            var nameDiv = document.createElement("div");
            var nameLabel = document.createElement("span");
            nameLabel.innerHTML = "Tank: ";
            nameLabel.style.cssText = labelStyle;
            var nameInfo = document.createElement("span");
            nameInfo.innerHTML = tank.tankName;
            nameInfo.style.cssText = defaultInfoStyle;
            nameDiv.appendChild(nameLabel);
            nameDiv.appendChild(nameInfo);
            tankWrapper.appendChild(nameDiv);
            
            // Fill Level
            var fillDiv = document.createElement("div");
            var fillLabel = document.createElement("span");
            fillLabel.innerHTML = "Fill level: ";
            fillLabel.style.cssText = labelStyle;
            var fillInfo = document.createElement("span");
            fillInfo.innerHTML = tank.fillLevel;
            fillInfo.style.cssText = defaultInfoStyle;
            fillDiv.appendChild(fillLabel);
            fillDiv.appendChild(fillInfo);
            tankWrapper.appendChild(fillDiv);
            
            // Last Reading (labeled "Last reading:"; red if > 48 hours old)
            var lastDiv = document.createElement("div");
            var lastLabel = document.createElement("span");
            lastLabel.innerHTML = "Last reading: ";
            lastLabel.style.cssText = labelStyle;
            var lastInfo = document.createElement("span");
            lastInfo.innerHTML = tank.lastReadingDate;
            var lastReadingStyle = defaultInfoStyle;
            if (tank.lastReadingDate && tank.lastReadingDate !== "N/A") {
                var readingDateObj = new Date(tank.lastReadingDate);
                var now = new Date();
                if ((now - readingDateObj) > 48 * 3600 * 1000) { // More than 48 hours old
                    lastReadingStyle = "color: red;";
                }
            }
            lastInfo.style.cssText = lastReadingStyle;
            lastDiv.appendChild(lastLabel);
            lastDiv.appendChild(lastInfo);
            tankWrapper.appendChild(lastDiv);
            
            // Expected empty (labeled "Expected empty:"; red if within 4 weeks)
            var expectedDiv = document.createElement("div");
            var expectedLabel = document.createElement("span");
            expectedLabel.innerHTML = "Expected empty: ";
            expectedLabel.style.cssText = labelStyle;
            var expectedInfo = document.createElement("span");
            expectedInfo.innerHTML = tank.runOutDate;
            var expectedStyle = defaultInfoStyle;
            if (tank.rawRunOutDate && tank.rawRunOutDate !== "N/A") {
                var runOutDateObj = new Date(tank.rawRunOutDate);
                var now = new Date();
                if ((runOutDateObj - now) <= 4 * 7 * 24 * 3600 * 1000) { // Within 4 weeks
                    expectedStyle = "color: red;";
                }
            }
            expectedInfo.style.cssText = expectedStyle;
            expectedDiv.appendChild(expectedLabel);
            expectedDiv.appendChild(expectedInfo);
            tankWrapper.appendChild(expectedDiv);
            
            wrapper.appendChild(tankWrapper);
        });
        
        return wrapper;
    }
});
