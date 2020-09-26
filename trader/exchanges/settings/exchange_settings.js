

module.exports = class Settings {
    constructor(ex, db){
        this.exchange = ex
        this.db = db       
        this.default_markets = []
        this.settings = null
        this.getMarketSettings =  this.getMarketSettings.bind(this)
        this.getDefaultMarkets = this.getDefaultMarkets.bind(this)
        this.init()
    }

    init(){
        this.db.getExchangeSettings(this.exchange).then( data => {
            this.default_markets = data.default_markets            
        })
    }

    getMarketSettings(market){
        return new Promise((resolve, reject) => {
            this.db.getExchangeSettings(this.exchange).then(data => {
                for(let mrk in data){
                    if(mrk === market){
                        this.settings = data[mrk]
                        return resolve(data[mrk])
                    }
                }
                console.log(data)
            }).catch(err=>{
                console.log(err)
            })
        })
        
    }   

    getDefaultMarkets(){

        return new Promise((resolve, reject) => {
            if(this.default_markets.length == 0){
                this.db.getExchangeSettings(this.exchange).then(data => {
                    this.default_markets = data.default_markets
                    return resolve(this.default_markets)
                }).catch(err => {
                    console.log(err)
                    return resolve([])
                })  
            }else{
                return resolve(this.default_markets)
            }
                             
        })
        
      
    }
   

    setSettings(){
        return new Promise((resolve, reject) => {

        })
    }
}

