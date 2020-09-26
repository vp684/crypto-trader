const GeminiAPI = require('gemini-api-vp').default
require('dotenv').config()
const sleep = require('../../../helper/sleep').sleep


class Gemini_Websocket{
    constructor(symbol){
        this.ws = new GeminiAPI.WebsocketClient({ key: process.env.GEMINI_KEY, secret: process.env.GEMINI_SECRET, sandbox: false });
        this.symbol = symbol
        this.socket_sequence = -1
        this.lastconnection = 0
        this.cb = null
        this.openMarketSocket = this.openMarketSocket.bind(this)
        this.init = this.init.bind(this)         
    }

    init(){
           
       
    }

    /**
     * open for each market
     * @param {*} market 
     */
    async openMarketSocket(cb){      

        let currdate = new Date().getTime() 
        //let _this = this
        if(currdate > this.lastconnection + 70000){

            this.ws.openMarketSocket(this.symbol, (market) => {
                this.lastconnection = new Date().getTime()  

                let handler = (data) => {      
                    if(data.socket_sequence === (this.socket_sequence +1) ){
                        this.socket_sequence = data.socket_sequence
                        if(data.type === 'heartbeat'){
                            console.log(data, this.symbol)
                        }else{                     
                            cb(data)
                        }
                        
                    }else{
                        console.log('dropped message')
                        //start reconnect process
                       
                        this.ws.removeMarketMessageListener(this.ws.marketSocket._events.message)                                           
                        this.socket_sequence = -1                       
                        this.openMarketSocket(cb)

                    }            
                    
                }

                this.ws.addMarketMessageListener(handler)
            })
        }else{
            await sleep(5000)
            this.openMarketSocket(cb)
        }

                
    }

    
    openOrderSocket(cb){

        this.ws.openOrderSocket(this.symbol, ( _data ) => {
            
            console.log('data', _data)

            this.ws.addOrderMessageListener( data => {
                if(data.type !== 'heartbeat'){
                    cb(data)
                }
                
            })
        })
               
    } 
    
    

}

module.exports = Gemini_Websocket