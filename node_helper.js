var NodeHelper = require("node_helper");
var https = require("https");
var xml2js = require("xml2js");

module.exports = NodeHelper.create({
    updateLatestLevel: function(config) {
        var self = this;
        var tanks = config.tanks;

        // Filter out any tank configs that have a blank or missing serialNumber.
        var validTanks = tanks.filter(function(tank) {
            return tank.serialNumber && tank.serialNumber.trim() !== "";
        });

        if (!validTanks || validTanks.length === 0) {
            self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", []);
            return;
        }

        // We'll store results for each tank.
        var results = [];
        var completedRequests = 0;
        var totalRequests = Math.min(validTanks.length, 3);

        validTanks.slice(0, 3).forEach(function(tankConfig, index) {
            var userId = "BOX" + tankConfig.serialNumber;
            var signalmanNo = tankConfig.serialNumber;
            
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
                    console.log("Received SOAP response for tank " + tankConfig.serialNumber + ":", data);
                    var parser = new xml2js.Parser({
                        explicitArray: false,
                        tagNameProcessors: [xml2js.processors.stripPrefix],
                        ignoreAttrs: true
                    });
                    parser.parseString(data, function(err, result) {
                        if (err) {
                            results[index] = { tankName: tankConfig.tankName, error: "XML parse error: " + err };
                        } else {
                            try {
                                var envelope = result.Envelope;
                                var body = envelope.Body;
                                var response = body.SoapMobileAPPGetLatestLevel_v3Response;
                                var resultData = response.SoapMobileAPPGetLatestLevel_v3Result;
                                var levelElement = resultData.Level;
                                
                                if (levelElement && levelElement.LevelPercentage && parseFloat(levelElement.LevelPercentage) !== -1) {
                                    var fillLevel = levelElement.LevelPercentage;
                                    var readingDate = levelElement.ReadingDate;
                                    var runOutDate = levelElement.RunOutDate;
                                    
                                    // Format the reading date (2-digit year, no seconds)
                                    var d = new Date(readingDate);
                                    var formattedReadingDate = d.toLocaleString("en-GB", {
                                        year: '2-digit',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    
                                    // Format the run out date as date only (2-digit year) if valid.
                                    var formattedRunOutDate = "";
                                    if (runOutDate && runOutDate !== "0001-01-01T00:00:00") {
                                        var dRun = new Date(runOutDate);
                                        formattedRunOutDate = dRun.toLocaleDateString("en-GB", {
                                            year: '2-digit',
                                            month: '2-digit',
                                            day: '2-digit'
                                        });
                                    }
                                    
                                    results[index] = {
                                        tankName: tankConfig.tankName,
                                        fillLevel: fillLevel + "%",
                                        lastReadingDate: formattedReadingDate,
                                        runOutDate: formattedRunOutDate,
                                        rawRunOutDate: runOutDate
                                    };
                                } else {
                                    results[index] = { tankName: tankConfig.tankName, error: "No valid level data" };
                                }
                            } catch (ex) {
                                results[index] = { tankName: tankConfig.tankName, error: "Error extracting data: " + ex };
                            }
                        }
                        completedRequests++;
                        if (completedRequests === totalRequests) {
                            self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", results);
                        }
                    });
                });
            });
            
            req.on("error", function(err) {
                results[index] = { tankName: tankConfig.tankName, error: "HTTP error: " + err };
                completedRequests++;
                if (completedRequests === totalRequests) {
                    self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", results);
                }
            });
            
            req.write(soapEnvelope);
            req.end();
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "WATCHMAN_DATA_REQUEST") {
            this.updateLatestLevel(payload);
        }
    }
});
