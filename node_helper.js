var NodeHelper = require("node_helper");
var https = require("https");

module.exports = NodeHelper.create({
    token: null,         // Access token obtained upon login.
    tokenExpiry: null,   // (Optional) Token expiry information.

    start: function() {
        console.log("Starting node helper for module: " + this.name);
    },

    // Listen for notifications from the front‑end.
    socketNotificationReceived: function(notification, payload) {
        if (notification === "WATCHMAN_DATA_REQUEST") {
            this.getWatchManData(payload);
        }
    },

    // Main function: authenticate (if needed) then fetch sensor data.
    getWatchManData: function(config) {
        var self = this;
        if (!this.token) {
            this.login(config, function(err) {
                if (err) {
                    self.sendSocketNotification("WATCHMAN_ERROR", "Login failed: " + err);
                } else {
                    self.fetchSensorData(config);
                }
            });
        } else {
            this.fetchSensorData(config);
        }
    },

    // Log in to the Kingspan Connect service.
    login: function(config, callback) {
        var self = this;
        // Assumed login endpoint – update as needed.
        var loginEndpoint = config.apiBaseUrl + "/login";
        var postData = JSON.stringify({
            username: config.username,
            password: config.password
        });

        var options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData)
            }
        };

        var req = https.request(loginEndpoint, options, function(res) {
            var data = "";
            res.on("data", function(chunk) {
                data += chunk;
            });
            res.on("end", function() {
                try {
                    var response = JSON.parse(data);
                    if (response.token) {
                        self.token = response.token;
                        // Optionally store expiry info if provided.
                        callback(null);
                    } else {
                        callback("No token received. Response: " + data);
                    }
                } catch (e) {
                    callback("Invalid JSON response: " + e);
                }
            });
        });

        req.on("error", function(err) {
            callback(err);
        });

        req.write(postData);
        req.end();
    },

    // Fetch sensor (tank) data from the API.
    fetchSensorData: function(config) {
        var self = this;
        // Assumed endpoint for sensor data – update this as needed.
        var sensorEndpoint = config.apiBaseUrl + "/sensit";

        var options = {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + this.token,
                "Content-Type": "application/json"
            }
        };

        var req = https.request(sensorEndpoint, options, function(res) {
            var data = "";
            res.on("data", function(chunk) {
                data += chunk;
            });
            res.on("end", function() {
                try {
                    var response = JSON.parse(data);
                    // Extract the sensor data. Adjust key names based on your reverse‑engineering.
                    var tankPercentage = response.tankPercentage || "N/A";
                    var lastReadingDate = response.lastReadingDate || "N/A";

                    var sensorData = {
                        lastReading: tankPercentage + (tankPercentage !== "N/A" ? "%" : ""),
                        lastReadingDate: lastReadingDate !== "N/A" ? new Date(lastReadingDate).toLocaleString() : "N/A"
                    };

                    self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", sensorData);
                } catch (e) {
                    self.sendSocketNotification("WATCHMAN_ERROR", "Error parsing sensor data: " + e);
                }
            });
        });

        req.on("error", function(err) {
            self.sendSocketNotification("WATCHMAN_ERROR", "Error fetching sensor data: " + err);
        });

        req.end();
    }
});
