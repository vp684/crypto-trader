const BigNumber = require('bignumber.js')

module.exports = class GeminiFormats{

    constructor(){
        
    }


        /**
         *      
         * @param {*} trades 
         * {
                "_id" : ObjectId("5eb9964ca13d9b796478b1aa"),
                "market" : "BTCUSD",
                "trade_id" : 19136323,
                "time" : ISODate("2017-08-12T01:42:06.325Z"),
                "side" : "buy",
                "size" : "0.01000000",
                "price" : "3638.14000000",
                "fee" : "0.00",
                "exchange" : "coinbase"
            }
         */
    restTrades(trades, symbol){
        return new Promise((resolve, reject) => {
            let final = []
            if(trades.length > 0){
                for (let i = 0; i < trades.length; i++) {
                    let trd = {}
                    trd.market = symbol
                    trd.trade_id = trades[i].tid
                    trd.time = new Date(trades[i].timestampms)
                    trd.side = trades[i].type.toLowerCase()
                    trd.size = trades[i].amount 
                    trd.price = trades[i].price
                    trd.fee = trades[i].fee_amount                
                    trd.exchange = 'gemini'
                    
                    final.push(trd)
                }
            }
            //reverse array gemini trades are latest first
            final.reverse()
            resolve(final)
        })
    }

    restTransfers(transfers, symbol){
        return new Promise((resolve, reject) => {
            let final = []  
            if(transfers.length > 0){
                for (let i = 0; i < transfers.length; i++) {
                    const item = transfers[i]
                    let xfer = {}
                    xfer.exchange = 'gemini'
                    xfer.market = item.currency
                    xfer.id = item.eid
                    xfer.type = item.type.toLowerCase()
                    xfer.time = new Date(item.timestampms)
                    xfer.amount = item.amount
                    xfer.exchange_specific = {
                        txHash : item.txHash, 
                        destination : item.destination
                    }
                    final.push(xfer)
                }

            }
            resolve(final)
        })
    }

    formatCandles(candles, digits, period){
        return new Promise((resolve, reject) =>{
            let final = null
            if(candles){
                    digits = Number(digits)
                    final = []
                   

                    for (let i = candles.length -1; i > -1; i--) {
                        let cndl = {
                            open: null,
                            high: null,
                            low: null,
                            close: null,
                            vol: null,
                            time: null
                        }                  

                        const candle = candles[i];
                        const cdate = new Date(candle[0])
                        //gemini reports bar open time. this uses bar closing time.
                        cdate.setHours(cdate.getHours() + 1)                                              

                        if(final.length > 0){
                            const finalhourormin = period === 'hr' ? final[0].time.getHours() : final[0].time.getMinutes()
                            const fcndl = final[0]

                            if(finalhourormin % digits === 0 ){
                                //insert a new bar
                                cndl.open = candle[1]
                                cndl.high = candle[2]
                                cndl.low = candle[3]
                                cndl.close = candle[4]
                                cndl.vol = candle[5]
                                cndl.time = cdate
                                final = [cndl, ...final]

                            }else{
                                let high, low, vol
                                high = BigNumber(candle[2])
                                low = BigNumber(candle[3])
                                vol = BigNumber(candle[5])

                                fcndl.high = high.isGreaterThan(fcndl.high) ? high.toNumber() : fcndl.high
                                fcndl.low = low.isLessThan(fcndl.low) ? low.toNumber() : fcndl.low
                                fcndl.vol = vol.plus(fcndl.vol).toNumber()
                                fcndl.close = candle[4]
                                fcndl.time = cdate

                            }

                        }else{
                            //final has no data, add first candle and round up date time to nearest close time   
                          
                            cndl.open = candle[1]
                            cndl.high = candle[2]
                            cndl.low = candle[3]
                            cndl.close = candle[4]
                            cndl.vol = candle[5]
                            cndl.time = cdate
                            final.push(cndl)
                        }


                        //dorps first few bars so we can sync up to period 
                        
                    }
                    resolve(final)
            }else{
                resolve(final)
            }
        })    
    }

}