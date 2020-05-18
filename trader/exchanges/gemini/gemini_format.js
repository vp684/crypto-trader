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
}