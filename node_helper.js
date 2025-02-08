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
                var parser = new xml2js.Parser({ explicitArray: false });
                parser.parseString(data, function(err, result) {
                    if (err) {
                        self.sendSocketNotification("WATCHMAN_ERROR", "XML parse error: " + err);
                    } else {
                        try {
                            // Navigate the parsed XML structure.
                            var envelope = result["soap:Envelope"];
                            var body = envelope["soap:Body"];
                            var response = body["SoapMobileAPPGetLatestLevel_v3Response"];
                            var resultData = response["SoapMobileAPPGetLatestLevel_v3Result"];
                            var level = resultData["Level"];
                            var levelPercentage = level["LevelPercentage"];
                            var readingDate = level["ReadingDate"];
                            
                            var sensorData = {
                                lastReading: levelPercentage + "%",
                                lastReadingDate: new Date(readingDate).toLocaleString()
                            };
                            
                            self.sendSocketNotification("WATCHMAN_DATA_RESPONSE", sensorData);
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
