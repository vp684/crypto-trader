


const logger = require('./helper/logger')
const express = require('express')


const app = express()
const port = 5000

const main_engine = require('./engine/main')
//const engine = new main_engine()


try{
    //routes       
    app.get('/start', (req, res) => {
        res.send({ express: 'BACKEND IS CONNECTED TO REACT' });
    });

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