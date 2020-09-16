const stompit = require('stompit')
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const axios = require('axios')

const directoryPath = path.join(__dirname, '../_in');
const nodiniteUrl = "http://localhost/Nodinite/Test/LogAPI/api/LogEvent";
const logAgentValueId = 100;

var watcher = chokidar.watch(directoryPath, {ignored: /^\./, persistent: true, awaitWriteFinish: true, cwd: directoryPath, depth: 0});

watcher
  .on('add', function(path) {
    if (!path.startsWith('_')) {
      readAndLogToNodinite(path);
    }
  })
  .on('error', function(error) {console.error('Error happened', error);})

function readAndLogToNodinite(file, errorCode, errorMsg) {
  var pathToFile = path.join(directoryPath, file);
  var correlationId = Date.now().toString();

  fs.readFile(pathToFile, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    
    if (pathToFile.endsWith(".json")) {
      logToNodinite(file, data, correlationId,0, "", function(file) {
        try {
          fs.unlinkSync(path.join(directoryPath, file));

          sendToQueue(data, correlationId);
          //file removed
        } catch(err) {
          console.error(err)
        }
      });
    }
    else {
      logToNodinite(file, data, correlationId, 0, "NOT A JSON FILE", function(file) {
        try {
          fs.unlinkSync(path.join(directoryPath, file));
          //file removed
        } catch(err) {
          console.error(err)
        }
      });
    }
  });
}

function logToNodinite(file, body, correlationId, errorCode, errorMsg, callback) {
  
  var logEvent = {
    "LogAgentValueId": logAgentValueId,
    "EndPointName": "INT001.IN",
    "EndPointUri": directoryPath,
    "EndPointDirection": 0,
    "EndPointTypeId": 60,
    "OriginalMessageTypeName": "Unparsed Interchange",
    "LogStatus": errorCode,
    "LogText": errorMsg,
    "LogDateTime": new Date().toISOString(),
    "Body": Buffer.from(body).toString('base64'),
    "Context": {
      "Filename": file,
      "Path": directoryPath,
      "CorrelationId": correlationId
    }
  };

  axios
    .post(nodiniteUrl, logEvent)
    .then(res => {
      callback(file);
    })
    .catch(error => {
      console.error(error)
    });

}

function sendToQueue(data, correlationId) {
  stompit.connect({ host: 'localhost', port: 61613 }, (error, client) => {
    frame = client.send({ destination: 'SampleQueue', correlationId: correlationId });  
    frame.write(data);
    frame.end();
  
    client.disconnect();
  });
}