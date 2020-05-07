
import React, {useState, useEffect }from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Markets from './Market'

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

export default function AllMarkets(props){
    const classes = useStyles();
    const exchange = props.match.params.id
    const [markets, setMarkets] = useState([])
    
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
        setMarkets(body)
        if (response.status !== 200) {
            throw Error(body.message) 
        }
    }

    useEffect(() => {
        loadMarkets()       
    }, [])   
            
    return(       
        <Markets markets={markets}/>      
    )
}