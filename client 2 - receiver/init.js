const stompit = require('stompit')
const axios = require('axios')

const nodiniteUrl = "http://localhost/Nodinite/Test/LogAPI/api/LogEvent";
const logAgentValueId = 100;
 
stompit.connect({ host: 'localhost', port: 61613 }, (err, client) => {
 
  client.subscribe({ destination: 'SampleQueue' }, (err, msg) => {

    var correlationId = msg.headers.correlationId;

    msg.readString('UTF-8', (err, body) => {
      
      logToNodinite(body, correlationId, 0, "", function() {
        console.log("Message received and logged");
      });

    });
 
  });
 
});




function logToNodinite(body, correlationId, errorCode, errorMsg, callback) {
  
  var logEvent = {
    "LogAgentValueId": logAgentValueId,
    "EndPointName": "INT001.OUT",
    "EndPointUri": "tcp://127.0.0.1:61613/SampleQueue",
    "EndPointDirection": 1,
    "EndPointTypeId": 60,
    "OriginalMessageTypeName": "Serialized Interchange",
    "LogStatus": errorCode,
    "LogText": errorMsg,
    "LogDateTime": new Date().toISOString(),
    "Body": Buffer.from(body).toString('base64'),
    "Context": {
      "CorrelationId": correlationId
    }
  };

  axios
    .post(nodiniteUrl, logEvent)
    .then(res => {
      callback();
    })
    .catch(error => {
      console.error(error)
    });

}