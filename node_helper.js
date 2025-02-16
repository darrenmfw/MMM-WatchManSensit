var NodeHelper = require("node_helper");
var https = require("https");
var xml2js = require("xml2js");

module.exports = NodeHelper.create({
    updateLatestLevel: function(config) {
        var self = this;
        var tanks = config.tanks;
        if (!tanks || !Array.isArray(tanks) || tanks.length === 0) {
            self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", []);
            return;
        }
        var validTanks = tanks.filter(function(tank) {
            return tank.serialNumber && tank.serialNumber.trim() !== "";
        });
        if (validTanks.length === 0) {
            self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", []);
            return;
        }
        var totalRequests = Math.min(validTanks.length, 3);
        var results = [];
        var completedRequests = 0;
        var primaryUserSerial = validTanks[0].serialNumber;

        validTanks.slice(0, 3).forEach(function(tankConfig, index) {
            var userId, signalmanNo;
            if (index === 0) {
                userId = "BOX" + tankConfig.serialNumber;
                signalmanNo = tankConfig.serialNumber;
            } else {
                userId = "BOX" + primaryUserSerial;
                signalmanNo = tankConfig.serialNumber;
            }
            
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
                                var body = result.Envelope?.Body?.SoapMobileAPPGetLatestLevel_v3Response?.SoapMobileAPPGetLatestLevel_v3Result;
                                if (!body) throw new Error("Missing SOAP response data");
                                
                                var levelElement = body.Level;
                                if (levelElement && levelElement.LevelPercentage && parseFloat(levelElement.LevelPercentage.trim()) >= 0) {
                                    var fillLevel = levelElement.LevelPercentage;
                                    var runOutDate = levelElement.RunOutDate;
                                    var litres = levelElement.LevelLitres || "N/A";
                                    var consumption = levelElement.ConsumptionRate || "N/A";
                                    var readingDate = levelElement.ReadingDate || "N/A";

                                    var formattedRunOutDate = runOutDate !== "0001-01-01T00:00:00" ? new Date(runOutDate).toLocaleDateString("en-GB") : "N/A";
                                    var formattedReadingDate = readingDate !== "0001-01-01T00:00:00" ? new Date(readingDate).toLocaleString("en-GB") : "N/A";
                                    console.log("Formatted Reading Date:", formattedReadingDate);
                                    
                                    results[index] = {
                                        tankName: tankConfig.tankName,
                                        fillLevel: fillLevel + "%",
                                        litresRemaining: litres + (litres !== "N/A" ? " L" : ""),
                                        runOutDate: formattedRunOutDate,
                                        rawRunOutDate: runOutDate,
                                        consumptionRate: consumption + (consumption !== "N/A" ? " L" : ""),
                                        readingDate: formattedReadingDate,
                                        displayFillLevel: tankConfig.displayFillLevel !== false,
                                        displayQuantityRemaining: tankConfig.displayQuantityRemaining !== false,
                                        displayExpectedEmpty: tankConfig.displayExpectedEmpty !== false,
                                        displayConsumption: tankConfig.displayConsumption !== false
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
