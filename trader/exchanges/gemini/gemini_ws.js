const GeminiAPI = require('gemini-api').default
require('dotenv').config()

const websocketClient = new GeminiAPI.WebsocketClient({ key: process.env.GEMINI_KEY, secret: process.env.GEMINI_SECRET, sandbox: false });


websocketClient.openMarketSocket('btcusd', () => {
    websocketClient.addMarketMessageListener(data => {
       // console.log(data)

        if(data.events[0].type === 'trade'){
           // console.log(data)
        }       
    });
   
});


websocketClient.openOrderSocket((data)=>{
  //  console.log(data)
    websocketClient.addOrderMessageListener(_data => {
        console.log(typeof _data, _data)


        // if(Array.isArray(_data) && _data[0].type === 'accepted'){
        //     setTimeout(()=>{
        //         api.cancelOrder(_data[0].order_id)
        //     }, 2000)
        // }
    })
}) 