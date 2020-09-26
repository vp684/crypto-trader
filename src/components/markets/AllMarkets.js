
import React, {useState, useEffect }from 'react';
//import { makeStyles } from '@material-ui/core/styles';
import Markets from './Markets'
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
     if(props.data){
         setMarkets(props.data.filter(item => item.exchange === exchange) )
     }
      
    }, [props.data.length])     
    
    return(       
        <Markets markets={markets} exchange={exchange} socket={props.socket}/>      
    )
}