

module.exports = class Settings {
    constructor(db){
        this.db = db       
        this.default_markets = ["btcusd", 'daiusd']
    }

    getSettings(market){
        this.db.getExchangeSettings('gemini', market).then(data => {
            console.log(data)
        }).catch(err=>{
            console.log(err)
        })
    }   

    getDefaultMarkets(exchange){
        this.db.getExchangeSettings(exchange).then(data => {

        })
    }
   

    setSettings(){
        return new Promise((resolve, reject) => {

        })
    }
}

