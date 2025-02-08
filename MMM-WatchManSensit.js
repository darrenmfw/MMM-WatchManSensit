Module.register("MMM-WatchManSensit", {

    // Default configuration options – these can be overridden in your config.js.
    defaults: {
        updateInterval: 600000, // 10 minutes (in milliseconds)
        loginEndpoint: "https://api.watchmanmonitoring.com/api/v1/auth/login",
        tanksEndpoint: "https://api.watchmanmonitoring.com/api/v1/tanks",
        username: "",
        password: "",
        lookBackDays: 14, // Timeframe (in days) over which to calculate the consumption rate
        thresholds: {
            green: 40, // If level >= 40%, bar will be green
            amber: 20  // If level >= 20% (but below green), bar will be amber; below 20% will be red
        },
        colours: {
            green: "green",
            amber: "orange",
            red: "red"
        },
        animationSpeed: 1000 // Speed of DOM update animation
    },

    // Initialise module
    start: function() {
        this.tanks = [];
        this.loaded = false;
        this.getData();
        this.scheduleUpdate();
    },

    // Load custom CSS
    getStyles: function() {
        return ["MMM-WatchManSensit.css"];
    },

    // Request data from node_helper
    getData: function() {
        this.sendSocketNotification("WMS_GET_DATA", {
            loginEndpoint: this.config.loginEndpoint,
            tanksEndpoint: this.config.tanksEndpoint,
            username: this.config.username,
            password: this.config.password
        });
    },

    // Schedule periodic updates
    scheduleUpdate: function() {
        var self = this;
        setInterval(function() {
            self.getData();
        }, this.config.updateInterval);
    },

    // Receive data from the node_helper
    socketNotificationReceived: function(notification, payload) {
        if (notification === "WMS_DATA") {
            this.tanks = payload;
            this.loaded = true;
            this.updateDom(this.config.animationSpeed);
        }
    },

    // Create the DOM elements for display
    getDom: function() {
        var wrapper = document.createElement("div");

        if (!this.loaded) {
            wrapper.innerHTML = "Loading tank data...";
            return wrapper;
        }

        var self = this;
        this.tanks.forEach(function(tank) {
            // Container for each tank
            var tankWrapper = document.createElement("div");
            tankWrapper.className = "tank";

            // Display tank name
            var title = document.createElement("div");
            title.className = "tank-title";
            title.innerHTML = tank.name;
            tankWrapper.appendChild(title);

            // Create vertical bar container
            var barContainer = document.createElement("div");
            barContainer.className = "bar-container";

            // Create the bar element with height proportional to the current level percentage
            var bar = document.createElement("div");
            bar.className = "bar";
            bar.style.height = tank.level + "%";

            // Determine the bar colour based on thresholds
            var colour = self.config.colours.red; // Default colour if below amber
            if (tank.level >= self.config.thresholds.green) {
                colour = self.config.colours.green;
            } else if (tank.level >= self.config.thresholds.amber) {
                colour = self.config.colours.amber;
            }
            bar.style.backgroundColor = colour;
            barContainer.appendChild(bar);
            tankWrapper.appendChild(barContainer);

            // Display the current level percentage text
            var levelText = document.createElement("div");
            levelText.className = "tank-level";
            levelText.innerHTML = "Level: " + tank.level + "%";
            tankWrapper.appendChild(levelText);

            // Calculate the estimated empty date using historical consumption data
            var emptyDateString = "N/A";

            // Check if the tank object contains history data
            if (tank.history && tank.history.length > 1) {
                var now = new Date();
                var lookBack = self.config.lookBackDays;
                // Filter the history to include only entries within the lookBack period
                var filteredHistory = tank.history.filter(function(record) {
                    var readingDate = new Date(record.reading_date);
                    var diffDays = (now - readingDate) / (1000 * 60 * 60 * 24);
                    return diffDays <= lookBack;
                });
                if (filteredHistory.length > 1) {
                    // Sort the filtered history by reading_date (oldest first)
                    filteredHistory.sort(function(a, b) {
                        return new Date(a.reading_date) - new Date(b.reading_date);
                    });
                    var firstRecord = filteredHistory[0];
                    var lastRecord = filteredHistory[filteredHistory.length - 1];
                    var daysDiff = (new Date(lastRecord.reading_date) - new Date(firstRecord.reading_date)) / (1000 * 60 * 60 * 24);
                    var consumption = firstRecord.level_percent - lastRecord.level_percent;
                    if (daysDiff > 0 && consumption > 0) {
                        var consumptionRate = consumption / daysDiff; // percentage drop per day
                        var remainingDays = lastRecord.level_percent / consumptionRate;
                        var estimatedEmptyDate = new Date();
                        estimatedEmptyDate.setDate(estimatedEmptyDate.getDate() + remainingDays);
                        var options = { year: 'numeric', month: 'short', day: 'numeric' };
                        emptyDateString = estimatedEmptyDate.toLocaleDateString("en-GB", options);
                    }
                }
            }

            var emptyText = document.createElement("div");
            emptyText.className = "tank-empty-date";
            emptyText.innerHTML = "Estimated Empty: " + emptyDateString;
            tankWrapper.appendChild(emptyText);

            wrapper.appendChild(tankWrapper);
        });

        return wrapper;
    }
});
