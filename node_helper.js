const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({

    start: function() {
        console.log("MMM-WatchManSensit Node Helper started...");
    },

    // Receive socket notifications from the module
    socketNotificationReceived: async function(notification, payload) {
        if (notification === "WMS_GET_DATA") {
            await this.getTankData(payload);
        }
    },

    // Authenticate and retrieve tank data from the WatchMan Monitoring API
    getTankData: async function(config) {
        const { loginEndpoint, tanksEndpoint, username, password } = config;
        if (!loginEndpoint || !tanksEndpoint || !username || !password) {
            console.error("Missing configuration parameters for WatchMan Monitoring API.");
            return;
        }

        try {
            // Login request – the API expects a POST with your credentials.
            const loginResponse = await fetch(loginEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: username, password: password })
            });

            if (!loginResponse.ok) {
                console.error("Login failed with status: " + loginResponse.status);
                return;
            }

            const loginData = await loginResponse.json();
            // Assume the API returns a token property
            const token = loginData.token;
            if (!token) {
                console.error("No token received from login.");
                return;
            }

            // Retrieve tanks data using the token for authentication
            const tanksResponse = await fetch(tanksEndpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!tanksResponse.ok) {
                console.error("Tanks request failed with status: " + tanksResponse.status);
                return;
            }

            const tanksData = await tanksResponse.json();
            // Assume tanksData is an array of tank objects. Adjust if the API nests the data.
            this.sendSocketNotification("WMS_DATA", tanksData);

        } catch (error) {
            console.error("Error retrieving tank data: " + error);
        }
    }
});
