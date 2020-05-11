
import React, { useState, useEffect } from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import io from 'socket.io-client'
import MarketCard from './MarketCard'

const useStyles = makeStyles({
    
    root: {
      minWidth: 100,
      maxWidth: 350, 
      margin: 10
    },
    bullet: {
      display: 'inline-block',
      margin: '0 2px',
      transform: 'scale(0.8)',
    },
    title: {
      fontSize: 14,
    },
    pos: {
      marginBottom: 12,
    },
  
    toggle: {
        backgroundColor: 'Red'
    }
  });



export default function Markets(props){
    const classes = useStyles();  
    const symbols = props.markets
    
    let [markets, setMarkets] = useState([])

    useEffect((test)=>{
      let socket = io.connect('http://localhost:8000', {reconnectionDelay: 3000})
      
      
      //final = [...final]
      
      symbols.forEach((value) => {
        
        console.log('freae', value)
        
        
        
        socket.on(value, (data)=>{
          let final = [...markets]
         
          let index = markets.findIndex(mrk => mrk.symbol === data.symbol)
          if(index !== -1){
        
            markets[index] = data
          }else{
   
            markets.push(data)
          }
          
          setMarkets([...markets])
      
        })
        
      })
      
                 
      console.log('ui market')

     
    }, [symbols])
  
 

    

   return (
 
      <>    
        {  markets.map((market, _key) => (
          <MarketCard data={market} key={_key}/>
        ))}
      </>


    )
             
}

     