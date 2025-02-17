Module.register("MMM-WatchManSensit", {
    defaults: {
        updateInterval: 3600000,   // Update every 1 hour.
        width: "auto",
        password: "Password1!",
        culture: "en",
        tanks: [
            {
                serialNumber: "12345678",
                tankName: "Main Tank",
                displayFillLevel: true,
                displayQuantityRemaining: true,
                displayConsumption: true,
                displayExpectedEmpty: true
            },
            {
                serialNumber: "87654321",
                tankName: "Secondary Tank",
                displayFillLevel: true,
                displayQuantityRemaining: true,
                displayConsumption: true,
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
