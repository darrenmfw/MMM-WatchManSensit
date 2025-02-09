var NodeHelper = require("node_helper");
var https = require("https");
var xml2js = require("xml2js");

module.exports = NodeHelper.create({
    updateLatestLevel: function(config) {
        var self = this;
        // Construct the SOAP XML envelope.
        // The user ID is constructed by prefixing "BOX" to the serialNumber,
        // and the signalman number is simply the serialNumber.
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
                            
                            // Expecting a <Tanks> element containing one or more <APITankInfo_V3> entries.
                            var tanksContainer = resultData.Tanks;
                            if (tanksContainer && tanksContainer.APITankInfo_V3) {
                                var tanks = tanksContainer.APITankInfo_V3;
                                // Ensure tanks is an array.
                                if (!Array.isArray(tanks)) {
                                    tanks = [tanks];
                                }
                                // Limit to a maximum of three tanks.
                                tanks = tanks.slice(0, 3);
                                
                                var sensors = [];
                                tanks.forEach(function(tank) {
                                    // Only process if there is valid data
                                    if (tank && tank.LevelPercentage && tank.ReadingDate) {
                                        var tankName = tank.TankName || "Unnamed Tank";
                                        var fillLevel = tank.LevelPercentage;
                                        var readingDate = tank.ReadingDate;
                                        var runOutDate = tank.RunOutDate;
                                        
                                        // Format reading date (2-digit year, no seconds)
                                        var d = new Date(readingDate);
                                        var formattedReadingDate = d.toLocaleString("en-GB", {
                                            year: '2-digit',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                        
                                        // Format run out date as date only (2-digit year)
                                        var formattedRunOutDate = "";
                                        if (runOutDate && runOutDate !== "0001-01-01T00:00:00") {
                                            var dRun = new Date(runOutDate);
                                            formattedRunOutDate = dRun.toLocaleDateString("en-GB", {
                                                year: '2-digit',
                                                month: '2-digit',
                                                day: '2-digit'
                                            });
                                        }
                                        
                                        sensors.push({
                                            tankName: tankName,
                                            fillLevel: fillLevel + "%",
                                            lastReadingDate: formattedReadingDate,
                                            runOutDate: formattedRunOutDate,
                                            rawRunOutDate: runOutDate
                                        });
                                    }
                                });
                                self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", sensors);
                            } else {
                                // No tanks data found.
                                self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", []);
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
