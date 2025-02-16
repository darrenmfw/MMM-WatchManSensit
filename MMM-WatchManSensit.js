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
                displayExpectedEmpty: true,
                displayLastReading: true
            },
            {
                serialNumber: "87654321", // Tank 2 serial (user ID from Tank 1 is used for this tank)
                tankName: "Secondary Tank",
                displayFillLevel: true,
                displayQuantityRemaining: true,
                displayConsumption: true,
                displayExpectedEmpty: true,
                displayLastReading: true
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
            console.log("Received Data:", payload);
            this.dataReceived = payload;
            this.updateDom();
        } else if (notification === "WATCHMAN_ERROR") {
            Log.error("WATCHMAN_ERROR: " + payload);
        }
    },

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
            
            tankWrapper.appendChild(this.createRow("Tank:", tank.tankName, labelStyle, defaultInfoStyle));
            
            if (tank.error) {
                tankWrapper.appendChild(this.createRow("Error:", tank.error, labelStyle, errorStyle));
            } else {
                if (tank.displayFillLevel) {
                    tankWrapper.appendChild(this.createRow("Fill level:", tank.fillLevel, labelStyle, defaultInfoStyle));
                }
                
                if (tank.displayLastReading) {
                    tankWrapper.appendChild(this.createRow("Last reading:", tank.readingDate, labelStyle, defaultInfoStyle));
                }
                
                if (tank.displayQuantityRemaining) {
                    tankWrapper.appendChild(this.createRow("Quantity remaining:", tank.litresRemaining, labelStyle, defaultInfoStyle));
                }
                
                if (tank.displayConsumption) {
                    tankWrapper.appendChild(this.createRow("Average use per day:", tank.consumptionRate, labelStyle, defaultInfoStyle));
                }
                
                if (tank.displayExpectedEmpty) {
                    tankWrapper.appendChild(this.createRow("Expected empty:", tank.runOutDate, labelStyle, defaultInfoStyle));
                }
            }
            
            wrapper.appendChild(tankWrapper);
        });
        
        return wrapper;
    }
});
