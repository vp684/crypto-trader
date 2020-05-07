const GeminiAPI = require('gemini-api-vp').default
require('dotenv').config()


class Gemini_Websocket{
    constructor(symbol){
        this.ws = new GeminiAPI.WebsocketClient({ key: process.env.GEMINI_KEY, secret: process.env.GEMINI_SECRET, sandbox: false });
        this.symbol = symbol
        this.socket_sequence = -1


        this.openMarketSocket = this.openMarketSocket.bind(this)
        this.init = this.init.bind(this)        
    }



    init(){
 
        //this.openMarketSocket(this.symbol)       
    }

    /**
     * open for each market
     * @param {*} market 
     */
    openMarketSocket(cb){        

        this.ws.openMarketSocket(this.symbol, (market) => {

            this.ws.addMarketMessageListener((data) => {      
                if(data.socket_sequence === (this.socket_sequence +1) ){
                    this.socket_sequence = data.socket_sequence
                    cb(data)
                }else{
                    console.log('dropped message')
                }            
                
            })
        })
                
    }

    openOrderSocket(){

        this.ws.openOrderSocket( data => {
            console.log('data', data)
            this.ws.addOrderMessageListener( _data => {
                console.log('_data', _data)
            })
        })
               
    } 
    
    

}

module.exports = Gemini_Websocket