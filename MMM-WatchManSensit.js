Module.register("MMM-WatchManSensit", {

    // Default configuration options.
    defaults: {
        updateInterval: 3600000,   // Update every 1 hour.
        password: "Password1!",    // Shared password for all tanks.
        culture: "en",             // Culture/language parameter.
        tanks: [
            {
                serialNumber: "12345678", // Example serial number for tank 1.
                tankName: "Main Tank"
            },
            {
                serialNumber: "87654321", // Example serial number for tank 2.
                tankName: "Secondary Tank"
            },
            {
                serialNumber: "11223344", // Example serial number for tank 3.
                tankName: "Tertiary Tank"
            }
        ]
    },

    start: function() {
        Log.info("Starting MMM-WatchManSensit module...");
        // Initialize dataReceived as an empty array.
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
        
        if (!this.dataReceived || this.dataReceived.length === 0) {
            wrapper.innerHTML = "No tank data available.";
            return wrapper;
        }
        
        var labelStyle = "color: grey; margin-right: 5px;";
        var defaultInfoStyle = "color: white;";
        var errorStyle = "color: red;";
        
        this.dataReceived.forEach(function(tank) {
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
            
            // Last Reading (labeled "Last reading:"; red if more than 48 hours old)
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
                    lastReadingStyle = errorStyle;
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
                if ((runOutDateObj - now) <= 28 * 24 * 3600 * 1000) { // Within 4 weeks
                    expectedStyle = errorStyle;
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
