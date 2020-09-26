
import React from 'react';
//import { makeStyles } from '@material-ui/core/styles';

import ExchangeCard from "./ExchangeCard"



// const useStyles = makeStyles((theme) => ({
//   main: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: theme.spacing(2, 1),

//     // necessary for content to be below app bar
//     ...theme.mixins.toolbar,
//   },
//   content: {
//     flexGrow: 1,
//     padding: theme.spacing(3),
//   },
   
// }));

export default function Exchanges(props){
    //const classes = useStyles();
    return(       
        <div > 
            {props.exchanges.map((ex, key) => (
                <ExchangeCard key={key} name={ex}/>
            ))}                                
        </div>      
    )
}