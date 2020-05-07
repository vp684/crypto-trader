const express = require('express')
const router = express.Router()

const socketIo = require('socket.io')
const http = require('http')

const main_engine = require('../trader/main')
const engine = new main_engine()



routes = (app) =>{

     /**
     * Socket io
     * 
     * 
     */

    const server = http.Server(app);
    const io = socketIo(server);
    const ioport = 8000


    io.on('connection', function (socket) {
       // engine.setClientSocket(socket)
        console.log('socket connected')

        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {
            console.log(data);
        });


    });

    server.listen(ioport);


    router.route('/toggle-exchange').post(async (req, res) => {
        let ex = req.body.exchange ? req.body.exchange : false
        let message = { data: 'invalid exchange'}
        if(ex){
          await engine.createExchange(ex).then(prom_res => {
            if(prom_res){
              res.send({data: `successfully added exchange`})
              return
            }else{
              res.send({data: 'failed to add exchange'})
              return
            }
            
          })
        }else{
          res.send({data: 'invalid exchange'})
        }       
    })




    return router

}

module.exports = routes