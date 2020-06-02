const BigNumber = require('bignumber.js')
const logger = require('../../helper/logger')

module.exports = class Strategy{

    constructor(){

    }


    applyStrategy(candles, settings){

        return new Promise(async (resolve, reject) => {

            let props = false
            props = this.__proto__.hasOwnProperty(settings.name)
  
            if(props){
                let final = await this[settings.name](candles, settings)
                resolve(final)
            }else{
                console.log('error - applyStrategy')
                logger.error('applyStrategy', `no prop for ${settings.name}`)
                resolve([])
            }
        })               
        
    }

    /**
     * 
     * @param {*} candles array of candles data index 0 should have latest data.
     * @param {*} settings Object with settings, {Number} period: ma period, {Number} percent: envelope percent (0.04 = 4 %), {String} type: ma type (simple) {Boolean}
     */
    maEnvelope(candles, settings = { period: 7, percent: 0.04, all: false}){
        return new Promise((resolve, reject) =>{
            let final = []
            settings.all = settings.all == undefined ? false : settings.all
            if(candles.length >= settings.period){
                let j = candles.length - settings.period - 1

                if(settings.all == false){ 
                    if( (settings.period) < candles.length){
                        j = settings.period
                    }
                }   
                                                          
                for(j; j > -1; j--){ // starts at end of index and decrease to first bar.
                    let close
                    let tempsum = new BigNumber(0) // 8 digits
                    let tempavg = new BigNumber(0)
                    let upperEV = new BigNumber(0)
                    let sma =     new BigNumber(0)
                    let lowerEV = new BigNumber(0)
            
                    for(let t = settings.period -1; t > -1; t--) {
                        tempsum = tempsum.plus(BigNumber(candles[j + t].close))
                        if(t==0){
                            close = candles[j + t].close
                        };
                    };
                    
                    tempavg = tempsum.dividedBy(BigNumber(settings.period))
                    upperEV = BigNumber(1).plus(BigNumber(settings.percent)).multipliedBy(tempavg).toFixed(8)//parseFloat((tempavg * (1 + percentage)).toFixed(5))
                    sma =  tempavg.toFixed(8) //parseFloat(tempavg.toFixed(5))
                    lowerEV = BigNumber(1).minus(BigNumber(settings.percent)).multipliedBy(tempavg).toFixed(8)   //parseFloat((tempavg * (1 - percentage)).toFixed(5))
                    final.unshift({                     
                        upperEV: Number(upperEV), 
                        sma: Number(sma), 
                        lowerEV: Number(lowerEV), 
                        close: close,
                        strategy: {
                            bidlevel: Number(lowerEV), 
                            asklevel: Number(upperEV) 
                        }
                        
                    })
              
                }  

                resolve({name: "maEnvelope", data: final, levels: final[0].strategy})
                
            }else{
                resolve({name: "maEnvelope", data: final})
            }



        })
    }

}