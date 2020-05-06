const GeminiAPI = require('gemini-api-vp').default
require('dotenv').config()




class Gemini_Websocket{
    constructor(){
        this.websocket = new GeminiAPI.WebsocketClient({ key: process.env.GEMINI_KEY, secret: process.env.GEMINI_SECRET, sandbox: false });

        this.init = this.init.bind(this)        
        this.init()
    }



    init(){
        this.initialized = true           
    }

    /**
     * open for each market
     * @param {*} market 
     */
    // openMarketSocket(market){        
    //     if(this.initialized){
    //         this.ws.openMarketSocket(market, (market) => {
    //             console.log(market)
    //             this.ws.addMarketMessageListener((data) => {
    //                 console.log(data, market.target.url)
    //             })
    //         })
    //     }
        
    // }

    openOrderSocket(){
        if(this.initialized){
            this.ws.openOrderSocket( data => {
                console.log('data', data)
                this.ws.addOrderMessageListener( _data => {
                    console.log('_data', _data)
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