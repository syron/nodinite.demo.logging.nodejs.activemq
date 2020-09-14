const stompit = require('stompit')
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const axios = require('axios')

const directoryPath = path.join(__dirname, '../_in');
const nodiniteUrl = "http://localhost/Nodinite/Test/LogAPI/api/LogEvent";
const logAgentValueId = 100;

var watcher = chokidar.watch(directoryPath, {ignored: /^\./, persistent: true, awaitWriteFinish: true, cwd: directoryPath});

watcher
  .on('add', function(path) {
    if (!path.startsWith('_')) {

      if (path.endsWith(".json")) {
        readAndLogToNodinite(path, 0, "");
      }
      else {
        readAndLogToNodinite(path, -1, "Not a JSON file");
      }

    }
    
  })
  // .on('change', function(path) {console.log('File', path, 'has been changed');})
  // .on('unlink', function(path) {console.log('File', path, 'has been removed');})
  .on('error', function(error) {console.error('Error happened', error);})

// 1. listen to folder
// 2. if file has been created
// 2a. if file JSON : log message to Nodinite, connect to artemis and send file
// 2b. if file XML : log error message to Nodinite

function readAndLogToNodinite(file, errorCode, errorMsg) {
  var pathToFile = path.join(directoryPath, file);

  fs.readFile(pathToFile, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    
    logToNodinite(file, data, errorCode, errorMsg);
  });
}

function logToNodinite(filename, body, errorCode, errorMsg) {
  
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
    "Body": Buffer.from(body).toString('base64')
  };

  axios
    .post(nodiniteUrl, logEvent)
    .then(res => {
      console.log(`statusCode: ${res.statusCode}`)
      console.log(res)
    })
    .catch(error => {
      console.error(error)
    });
    
}

function readFromQueue() {
  stompit.connect({ host: 'localhost', port: 61613 }, (err, client) => {
    frame = client.send({ destination: 'SampleQueue' })
  
    frame.write('Simples Assim')
  
    frame.end()
  
    client.disconnect()
  });
}