const express = require('express')
const router = express.Router()
const Mongo = require('../database/mongo')


const _Engine = require('../trader/engine')
const engine = new _Engine()



routes = (app, io) =>{

     /**
     * Socket io
     * 
     * 
    */


    io.on('connection', function (socket) {
        console.log('socket connected', socket.id)                             
        engine.setExchangeSocket(socket)      
    });
  

    io.on('error', (error)=>{
      console.log('socket error', error)
    })
    
    io.on('disconnect', (event)=>{
      console.log('disconnect', event)
    })

    io.on('reconnecting', (reconn)=>{
      console.log('reconnecting', reconn)
    })

    


    router.route('/toggle-exchange').post(async (req, res) => {
        let ex = req.body.exchange ? req.body.exchange : false
        let message = { data: 'invalid exchange'}
        if(ex){
          let toggle = engine.getExchangeStatus(ex)


          if(toggle){
            //shutdown exchange
            await engine.removeExchange(ex).then(prom_res =>{
              if(prom_res){
                message.data = "exchange removed"
              }
            })

          }else{
            await engine.createExchange(ex).then(prom_res => {
              if(prom_res){
                message.data = `successfully added exchange`           
           
              }else{
                message.data = 'failed to add exchange'
              }                             
              
            })
          }  

            res.send(message)

          
        }else{
          res.send({data: 'invalid exchange'})
        }       
    })

    router.route('/getmarkets').post(async (req, res) => {
      let ex = req.body.exchange ? req.body.exchange : false
      let message = { data: 'invalid exchange'}
      if(ex){
        await engine.getMarkets(ex).then(prom_res => {
          if(prom_res){
            res.send(prom_res)
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

    router.route('/getActiveExchanges').get(async (req, res) => {
      let final = await engine.getActiveExchangeNames()
      res.send(final)
    })

    router.route('/get-config').post(async (req, res) => {
      let config = await engine.getConfig(req.body.ex, req.body.market)
      res.send(config)
    })

    router.route('/set-config').post(async (req, res) => {
     
      await engine.setConfig(req.body)
      res.send("ok")
    })

    return router

}

module.exports = routes