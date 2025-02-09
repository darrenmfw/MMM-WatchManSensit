var NodeHelper = require("node_helper");
var https = require("https");
var xml2js = require("xml2js");

module.exports = NodeHelper.create({
    updateLatestLevel: function(config) {
        var self = this;
        // Construct the SOAP XML envelope for the "Get Latest Level" call.
        var soapEnvelope =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
          'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
            '<soap:Body>' +
              '<SoapMobileAPPGetLatestLevel_v3 xmlns="http://mobileapp/">' +
                '<userid>' + config.userid + '</userid>' +
                '<password>' + config.password + '</password>' +
                '<signalmanno>' + config.signalmanno + '</signalmanno>' +
                '<culture>' + config.culture + '</culture>' +
              '</SoapMobileAPPGetLatestLevel_v3>' +
            '</soap:Body>' +
          '</soap:Envelope>';

        var options = {
            hostname: 'www.connectsensor.com',
            path: '/soap/MobileApp.asmx',
            method: 'POST',
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": '"http://mobileapp/SoapMobileAPPGetLatestLevel_v3"',
                "Content-Length": Buffer.byteLength(soapEnvelope)
            }
        };

        var req = https.request(options, function(res) {
            var data = "";
            res.on("data", function(chunk) {
                data += chunk;
            });
            res.on("end", function() {
                console.log("Received SOAP response:", data);
                // Use tagNameProcessors to strip namespace prefixes.
                var parser = new xml2js.Parser({
                    explicitArray: false,
                    tagNameProcessors: [xml2js.processors.stripPrefix]
                });
                parser.parseString(data, function(err, result) {
                    if (err) {
                        self.sendSocketNotification("WATCHMAN_ERROR", "XML parse error: " + err);
                    } else {
                        console.log("Parsed XML object:", result);
                        try {
                            // With prefixes stripped, the structure should be easier to navigate.
                            var envelope = result.Envelope;
                            var body = envelope.Body;
                            var response = body.SoapMobileAPPGetLatestLevel_v3Response;
                            var resultData = response.SoapMobileAPPGetLatestLevel_v3Result;
                            
                            // Extract Level data.
                            var levelElement = resultData.Level;
                            if (levelElement && levelElement.LevelPercentage && parseFloat(levelElement.LevelPercentage) > 0) {
                                var levelPercentage = levelElement.LevelPercentage;
                                var readingDate = levelElement.ReadingDate;
                                var sensorData = {
                                    lastReading: levelPercentage + "%",
                                    lastReadingDate: new Date(readingDate).toLocaleString()
                                };
                                self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", sensorData);
                            } else {
                                // Fallback: if Level data is missing or invalid, use SmartServReading (though these are usually defaults).
                                var smartReading = resultData.SmartServReading;
                                var fallbackPercentage = smartReading ? smartReading.LevelPercentage : "N/A";
                                var fallbackDate = smartReading ? smartReading.ReadingDate : "N/A";
                                var sensorDataFallback = {
                                    lastReading: fallbackPercentage + (fallbackPercentage !== "N/A" ? "%" : ""),
                                    lastReadingDate: fallbackDate !== "N/A" ? new Date(fallbackDate).toLocaleString() : "N/A"
                                };
                                self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", sensorDataFallback);
                            }
                        } catch (ex) {
                            self.sendSocketNotification("WATCHMAN_ERROR", "Error extracting data: " + ex);
                        }
                    }
                });
            });
        });

        req.on("error", function(err) {
            self.sendSocketNotification("WATCHMAN_ERROR", "HTTP error: " + err);
        });

        req.write(soapEnvelope);
        req.end();
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "WATCHMAN_DATA_REQUEST") {
            this.updateLatestLevel(payload);
        }
    }
});
