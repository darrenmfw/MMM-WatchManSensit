Module.register("MMM-WatchManSensit", {

    // Default configuration options.
    defaults: {
        updateInterval: 60000, // Update every 60 seconds.
        userid: "",           // e.g., "BOX12345678"
        password: "",         // e.g., "Password1!"
        signalmanno: "",      // e.g., "12345678"
        culture: "en"
    },

    start: function() {
        Log.info("Starting MMM-WatchManSensit module...");
        this.dataReceived = {
            lastReading: "N/A",
            lastReadingDate: "N/A"
        };
        // Request data immediately
        this.sendSocketNotification("WATCHMAN_DATA_REQUEST", this.config);
        // Schedule periodic updates
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
        
        return wrapper;
    }
});
