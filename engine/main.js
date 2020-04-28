const internet = require('../helper/checkinternet')
const logger = require('../helper/logger')


class Engine {
    constructor(){
        this.init()
    }

    async init(){
        internet.checkInternet((val) =>{
            console.log(val)
           
        })

    }

    async start(){
        
    }




}




module.exports = Engine