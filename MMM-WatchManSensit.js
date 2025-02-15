Module.register("MMM-WatchManSensit", {

    defaults: {
        updateInterval: 3600000,   // Update every 1 hour.
        width: "auto", // Set a custom width for the module (e.g., "300px" or "50%"). The default is "auto".
        password: "Password1!",    // Shared password for all tanks.
        culture: "en",             // Culture/language parameter.
        tanks: [
            {
                serialNumber: "12345678", // Tank 1 serial (used for both user ID and signalman for Tank 1)
                tankName: "Main Tank",
                displayFillLevel: true,
                displayQuantityRemaining: true,
                displayConsumption: true,
                displayLastReading: true,
                displayExpectedEmpty: true
            },
            {
                serialNumber: "87654321", // Tank 2 serial (user ID from Tank 1 is used for this tank)
                tankName: "Secondary Tank",
                displayFillLevel: true,
                displayQuantityRemaining: true,
                displayConsumption: true,
                displayLastReading: true,
                displayExpectedEmpty: true
            },
            {
                serialNumber: "",         // Blank serial; this tank will be omitted.
                tankName: "Tertiary Tank",
                displayFillLevel: true,
                displayQuantityRemaining: true,
                displayConsumption: true,
                displayLastReading: true,
                displayExpectedEmpty: true
            }
        ]
    },

    start: function() {
        Log.info("Starting MMM-WatchManSensit module...");
        this.dataReceived = [];
        this.sendSocketNotification("WATCHMAN_DATA_REQUEST", this.config);
        setInterval(() => {
            this.sendSocketNotification("WATCHMAN_DATA_REQUEST", this.config);
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

    // Helper function to create a row with flex styling (label left, data right)
    createRow: function(labelText, dataText, labelStyle, dataStyle) {
        var row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.width = "100%";
        
        var label = document.createElement("span");
        label.innerHTML = labelText;
        label.style.cssText = labelStyle;
        
        var data = document.createElement("span");
        data.innerHTML = dataText;
        data.style.cssText = dataStyle;
        
        row.appendChild(label);
        row.appendChild(data);
        return row;
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        // Set custom width if provided.
        if (this.config.width) {
            wrapper.style.width = this.config.width;
        }
        
        if (!this.dataReceived || this.dataReceived.length === 0) {
            wrapper.innerHTML = "No tank data available.";
            return wrapper;
        }
        
        var labelStyle = "color: grey; margin-right: 5px;";
        var defaultInfoStyle = "color: white;";
        var errorStyle = "color: red;";
        
        this.dataReceived.forEach((tank) => {
            var tankWrapper = document.createElement("div");
            tankWrapper.style.marginBottom = "10px";
            tankWrapper.style.paddingBottom = "5px";
            tankWrapper.style.borderBottom = "1px solid grey";
            
            // Tank Name row
            tankWrapper.appendChild(this.createRow("Tank:", tank.tankName, labelStyle, defaultInfoStyle));
            
            // If there's an error, display it and skip the rest.
            if (tank.error) {
                tankWrapper.appendChild(this.createRow("Error:", tank.error, labelStyle, errorStyle));
            } else {
                // Fill Level
                if (tank.displayFillLevel) {
                    tankWrapper.appendChild(this.createRow("Fill level:", tank.fillLevel, labelStyle, defaultInfoStyle));
                }
                
                // Quantity remaining
                if (tank.displayQuantityRemaining) {
                    tankWrapper.appendChild(this.createRow("Quantity remaining:", tank.litresRemaining, labelStyle, defaultInfoStyle));
                }
                
                // Average use per day (Consumption Rate)
                if (tank.displayConsumption) {
                    tankWrapper.appendChild(this.createRow("Average use per day:", tank.consumptionRate, labelStyle, defaultInfoStyle));
                }
                
                // Last Reading: Simply use toLocaleString (will use the default format for "en-GB")
                if (tank.displayLastReading) {
                    var formattedLastReading = "N/A";
                    if (tank.lastReadingDate && tank.lastReadingDate !== "N/A") {
                        var d = new Date(tank.lastReadingDate);
                        if (!isNaN(d.getTime())) {
                            formattedLastReading = d.toLocaleString("en-GB");
                        }
                    }
                    var lastReadingDataStyle = defaultInfoStyle;
                    if (tank.lastReadingDate && tank.lastReadingDate !== "N/A") {
                        var readingDateObj = new Date(tank.lastReadingDate);
                        var now = new Date();
                        if ((now - readingDateObj) > 48 * 3600 * 1000) { // More than 48 hours old
                            lastReadingDataStyle = errorStyle;
                        }
                    }
                    tankWrapper.appendChild(this.createRow("Last reading:", formattedLastReading, labelStyle, lastReadingDataStyle));
                }
                
                // Expected empty
                if (tank.displayExpectedEmpty) {
                    tankWrapper.appendChild(this.createRow("Expected empty:", tank.runOutDate, labelStyle, defaultInfoStyle));
                }
            }
            
            wrapper.appendChild(tankWrapper);
        });
        
        return wrapper;
    }
});
