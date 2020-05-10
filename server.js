


const logger = require('./helper/logger')
const express = require('express')
var bodyParser = require('body-parser')

const socketIo = require('socket.io')
const http = require('http')




const app = express()
const port = 5000


const server = http.Server(app);
const io = socketIo(server);
const ioport = 8000
server.listen(ioport);

const routes = require('./routes/routes')(app, io)



try{
    //routes       
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())

    app.use(routes)
   
    //start express server
    app.listen(port, () => console.log(`server started at http://localhost:${port}`))

}
catch(e){
    logger.error('express route error', e)
}


process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
    logger.error('Unhandled Rejection at Promise', p, reason)
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    logger.error('uncaught exception', err)
    process.exit(1);
});