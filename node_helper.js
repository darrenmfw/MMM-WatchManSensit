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
        // Filter out any tanks with a blank or missing serial number.
        var validTanks = tanks.filter(function(tank) {
            return tank.serialNumber && tank.serialNumber.trim() !== "";
        });
        var totalRequests = Math.min(validTanks.length, 3);
        var results = [];
        var completedRequests = 0;

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
                                if (!result.Envelope) {
                                    throw new Error("Missing Envelope");
                                }
                                var body = result.Envelope.Body;
                                if (!body) {
                                    throw new Error("Missing Body");
                                }
                                var response = body.SoapMobileAPPGetLatestLevel_v3Response;
                                if (!response) {
                                    throw new Error("Missing SoapMobileAPPGetLatestLevel_v3Response");
                                }
                                var resultData = response.SoapMobileAPPGetLatestLevel_v3Result;
                                if (!resultData) {
                                    throw new Error("Missing SoapMobileAPPGetLatestLevel_v3Result");
                                }
                                
                                var levelElement = resultData.Level;
                                // Accept valid data if LevelPercentage exists and is >= 0.
                                if (levelElement && levelElement.LevelPercentage && parseFloat(levelElement.LevelPercentage.trim()) >= 0) {
                                    var fillLevel = levelElement.LevelPercentage;
                                    var readingDate = levelElement.ReadingDate;
                                    var runOutDate = levelElement.RunOutDate;
                                    
                                    var d = new Date(readingDate);
                                    var formattedReadingDate = d.toLocaleString("en-GB", {
                                        year: '2-digit',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    
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
