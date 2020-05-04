const GeminiAPI = require('gemini-api').default
require('dotenv').config()




class Gemini_Websocket{
    constructor(){
        this.ws = new GeminiAPI.WebsocketClient({ key: process.env.GEMINI_KEY, secret: process.env.GEMINI_SECRET, sandbox: false });

        this.init = this.init.bind(this)
        this.initialized = false
        this.init()
    }



    init(){
        this.initialized = true
        this.openMarketSocket('btcusd')
        this.openOrderSocket()
    }

    openMarketSocket(market){
        if(!this.initialized){
            this.ws.openMarketSocket(market, () => {
                this.ws.addMarketMessageListener(data => {
                   // console.log(data)
                })
            })
        }
        
    }

    openOrderSocket(){
        if(!this.initialized){
            this.ws.openOrderSocket( data => {
                console.log('data', data)
                this.ws.addOrderMessageListener( _data => {
                    //console.log('_data', _data)
                })
            })
        }
        
    }
    

}

module.exports = Gemini_Websocket

// const websocketClient = new GeminiAPI.WebsocketClient({ key: process.env.GEMINI_KEY, secret: process.env.GEMINI_SECRET, sandbox: false });


// websocketClient.openMarketSocket('btcusd', () => {
//     websocketClient.addMarketMessageListener(data => {
//        // console.log(data)

//         if(data.events[0].type === 'trade'){
//            // console.log(data)
//         }       
//     });
   
//});


// websocketClient.openOrderSocket((data)=>{
//   //  console.log(data)
//     websocketClient.addOrderMessageListener(_data => {
//         console.log(typeof _data, _data)


//         // if(Array.isArray(_data) && _data[0].type === 'accepted'){
//         //     setTimeout(()=>{
//         //         api.cancelOrder(_data[0].order_id)
//         //     }, 2000)
//         // }
//     })
// }) 