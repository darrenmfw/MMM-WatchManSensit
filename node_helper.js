var NodeHelper = require("node_helper");
var https = require("https");
var xml2js = require("xml2js");

module.exports = NodeHelper.create({
    updateLatestLevel: function(config) {
        var self = this;
        // Construct the SOAP XML envelope using the serialNumber.
        // User ID is "BOX" concatenated with the serialNumber,
        // and signalman number is the serialNumber itself.
        var userId = "BOX" + config.serialNumber;
        var signalmanNo = config.serialNumber;
        
        var soapEnvelope =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
          'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
            '<soap:Body>' +
              '<SoapMobileAPPGetLatestLevel_v3 xmlns="http://mobileapp/">' +
                '<userid>' + userId + '</userid>' +
                '<password>' + config.password + '</password>' +
                '<signalmanno>' + signalmanNo + '</signalmanno>' +
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
                var parser = new xml2js.Parser({
                    explicitArray: false,
                    tagNameProcessors: [xml2js.processors.stripPrefix],
                    ignoreAttrs: true
                });
                parser.parseString(data, function(err, result) {
                    if (err) {
                        self.sendSocketNotification("WATCHMAN_ERROR", "XML parse error: " + err);
                    } else {
                        console.log("Parsed XML object:", result);
                        try {
                            var envelope = result.Envelope;
                            var body = envelope.Body;
                            var response = body.SoapMobileAPPGetLatestLevel_v3Response;
                            var resultData = response.SoapMobileAPPGetLatestLevel_v3Result;
                            console.log("Result Data Keys:", Object.keys(resultData));
                            
                            var levelElement = resultData.Level;
                            if (levelElement && levelElement.LevelPercentage) {
                                var fillLevel = levelElement.LevelPercentage;
                                var readingDate = levelElement.ReadingDate;
                                var runOutDate = levelElement.RunOutDate;
                                
                                // Format the reading date without seconds.
                                var d = new Date(readingDate);
                                var formattedReadingDate = d.toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                
                                // Format the run out date as date only.
                                var formattedRunOutDate = "N/A";
                                if (runOutDate && runOutDate !== "0001-01-01T00:00:00") {
                                    var dRun = new Date(runOutDate);
                                    formattedRunOutDate = dRun.toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                    });
                                }
                                
                                var sensorData = {
                                    fillLevel: fillLevel + "%",
                                    lastReadingDate: formattedReadingDate,
                                    runOutDate: formattedRunOutDate
                                };
                                self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", sensorData);
                            } else {
                                // Fallback to SmartServReading if Level is missing or invalid.
                                var smartReading = resultData.SmartServReading;
                                var fallbackPercentage = smartReading ? smartReading.LevelPercentage : "N/A";
                                var fallbackDate = smartReading ? smartReading.ReadingDate : "N/A";
                                var fallbackRunOut = smartReading ? smartReading.RunOutDate : "N/A";
                                
                                var formattedFallbackDate = "N/A";
                                if (fallbackDate !== "N/A" && fallbackDate !== "0001-01-01T00:00:00") {
                                    var dFallback = new Date(fallbackDate);
                                    formattedFallbackDate = dFallback.toLocaleString(undefined, {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                }
                                
                                var formattedFallbackRunOut = "N/A";
                                if (fallbackRunOut !== "N/A" && fallbackRunOut !== "0001-01-01T00:00:00") {
                                    var dFallbackRun = new Date(fallbackRunOut);
                                    formattedFallbackRunOut = dFallbackRun.toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                    });
                                }
                                
                                var sensorDataFallback = {
                                    fillLevel: fallbackPercentage + (fallbackPercentage !== "N/A" ? "%" : ""),
                                    lastReadingDate: formattedFallbackDate,
                                    runOutDate: formattedFallbackRunOut
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
