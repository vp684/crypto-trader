

module.exports = class Settings {
    constructor(db){
        this.db = db
        this.markets =  ["BTCUSD", "ETHBTC", "ETHUSD", "ZECUSD", "ZECBTC", "ZECETH", "ZECBCH", "zecltc", "bchusd", "bchbtc", "bcheth", "ltcusd", "ltcbtc", "ltceth", 
        "ltcbch", "batusd", "DAIUSD", "linkusd", "oxtusd", "batbtc", "daibtc", "linkbtc", "oxtbtc", "bateth", "daieth", "linketh", "oxteth"],

        this.default_markets = ["btcusd", 'daiusd']
    }

    getSettings(market, exchange){
        if(exchange === 'gemini'){
            if(market === 'DAIUSD'){
                return{
                    tradeable: 300.00, 
                    num_entries: 3, 
                    min_bid_vol: 0.1
                }
            }

        }
    }   
   

    setSettings(){
        return new Promise((resolve, reject) => {

        })
    }
}

