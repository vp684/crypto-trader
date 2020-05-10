
import React, {useState, useEffect }from 'react';
//import { makeStyles } from '@material-ui/core/styles';
import Markets from './Markets'
import io from 'socket.io-client'
// const useStyles = makeStyles({
    
//     root: {
//       minWidth: 100,
//       maxWidth: 350, 
//       margin: 10
//     },
//     bullet: {
//       display: 'inline-block',
//       margin: '0 2px',
//       transform: 'scale(0.8)',
//     },
//     title: {
//       fontSize: 14,
//     },
//     pos: {
//       marginBottom: 12,
//     },
  
//     toggle: {
//         backgroundColor: 'Red'
//     }
//   });

export default function AllMarkets(props){
   // const classes = useStyles();
    const exchange = props.match.params.id
    const [markets, setMarkets] = useState([])


    useEffect(() => {
      const loadMarkets = async () =>{
        let data = { 'exchange': exchange }
    
        const response = await fetch('/getmarkets', {
            method:'POST', 
            headers:{
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(data)
        });
        const body = await response.json();
     
        if (response.status !== 200) {
            throw Error(body.message) 
        }

        setMarkets(body)

        

      }
          
      loadMarkets()    
      
      
    }, [exchange])   
            
    return(       
        <Markets markets={markets} socket={props.socket}/>      
    )
}