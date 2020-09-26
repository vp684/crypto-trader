
import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
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
    //const classes = useStyles();  
    let [markets, setMarkets] = useState([]) 

    useEffect(() => {
      setMarkets(props.markets)
    }, [props.markets.length])

    return ( 
      <>    
        {  markets.map((market, _key) => (
          <MarketCard data={market} exchange={props.exchange}key={_key}/>
        ))}
      </>
    )
             
}

     