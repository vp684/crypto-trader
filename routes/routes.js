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



    return router

}

module.exports = routes