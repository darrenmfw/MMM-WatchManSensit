Module.register("MMM-WatchManSensit", {
    defaults: {
        apiUrl: "http://localhost:5001/get-oil-levels",
        updateInterval: 60000
    },

    start: function() {
        this.sendSocketNotification("GET_OIL_LEVELS");
        setInterval(() => {
            this.sendSocketNotification("GET_OIL_LEVELS");
        }, this.config.updateInterval);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "OIL_LEVELS_DATA") {
            this.oilData = payload;
            this.updateDom();
        }
    },

    getDom: function() {
        let wrapper = document.createElement("div");
        if (!this.oilData) {
            wrapper.innerHTML = "Loading oil levels...";
            return wrapper;
        }

        for (const [tank, data] of Object.entries(this.oilData)) {
            let tankDiv = document.createElement("div");
            tankDiv.className = "tank-container";

            let levelDiv = document.createElement("div");
            levelDiv.className = "tank-level";
            levelDiv.style.height = `${data.level}%`;

            let label = document.createElement("div");
            label.className = "tank-label";
            label.innerHTML = `${tank}: ${data.level}% (Est. ${data.estimatedDate})`;

            tankDiv.appendChild(levelDiv);
            tankDiv.appendChild(label);
            wrapper.appendChild(tankDiv);
        }

        return wrapper;
    },

    getStyles: function() {
        return ["MMM-WatchManSensit.css"];
    },

    getScripts: function() {
        return [];
    }
});
