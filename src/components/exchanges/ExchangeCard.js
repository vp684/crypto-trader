import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { useHistory } from "react-router-dom";

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

export default function ExchangeCard(props) {
  const classes = useStyles();
  let history = useHistory()

  const ex_name = props.name

  const toggleExchange = async () =>{
    let data = { 'exchange': ex_name.toLowerCase() }
    
    const response = await fetch('/toggle-exchange', {
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
    

  }

  const handleUrl = (exName) =>{
    let exchange = exName.toLowerCase()
    let link = `/markets/${exchange}`
    history.push(link)
  }

  return (
    <Card className={classes.root}>
      <CardContent>     
        <Typography variant="h5" component="h2">
            {ex_name}
        </Typography>       
        <Typography variant="body2" component="p">
          REST and Websocket API        
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" className={classes.toggle} onClick={toggleExchange} >On / Off</Button>
        <Button size='small' onClick={() =>{handleUrl(ex_name)}}>Markets</Button>
        <Button size="small">Settings</Button>
        
      </CardActions>
    </Card>
  );
}