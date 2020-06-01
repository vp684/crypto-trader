

module.exports = class Settings {
    constructor(db){
        this.db = db
        this.markets =  ["BTCUSD", "ETHBTC", "ETHUSD", "ZECUSD", "ZECBTC", "ZECETH", "ZECBCH", "zecltc", "bchusd", "bchbtc", "bcheth", "ltcusd", "ltcbtc", "ltceth", 
        "ltcbch", "batusd", "DAIUSD", "linkusd", "oxtusd", "batbtc", "daibtc", "linkbtc", "oxtbtc", "bateth", "daieth", "linketh", "oxteth"],

        this.default_markets = ["btcusd", 'daiusd']
    }

    getSettings(market){
        this.db.getExchangeSettings('gemini', market).then(data=>{

        }).catch(err=>{
            console.log(err)
        })
    }   
   

    setSettings(){
        return new Promise((resolve, reject) => {

        })
    }
}

