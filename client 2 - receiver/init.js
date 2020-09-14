const stompit = require('stompit')
 
stompit.connect({ host: 'localhost', port: 61613 }, (err, client) => {
 
  client.subscribe({ destination: 'SampleQueue' }, (err, msg) => {
 
    msg.readString('UTF-8', (err, body) => {
      console.log(body)
 
    })
 
  })
 
})