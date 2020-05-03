


const logger = require('./helper/logger')
const express = require('express')
var bodyParser = require('body-parser')


const app = express()
const port = 5000

const main_engine = require('./trader/main')
const engine = new main_engine()


try{
    //routes       
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())

    app.get('/start', (req, res) => {
      
        res.send({ express: 'BACKEND IS CONNECTED TO REACT' });
    });

    app.post('/toggle-exchange', async (req, res) => {
        let ex = req.body.exchange ? req.body.exchange : null
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