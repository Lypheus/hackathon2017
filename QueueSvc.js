/* A simple memory based queue service, will allow for storing and retrieving
   queued json blocks.  Also supports querying current load based on queue
   depth and on avg queue load.

   Execution Cmd Line Example:
   node QueueSvc.js 9999
*/

// TODO : generate a unique UUID for each item and stamp as they come in

var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var queueLib = require ('./node_modules/queue/Queue.js')
var utils = require ('./Utils.js')


// initialize queue service
var queue = queueLib.Queue;
app.use( bodyParser.json( ) );

// validate that a valid port was provided
var port = 8080;
if( process.argv.length > 2 )
{
  if( isNaN( process.argv[ 2 ] ) )
  {
      console.log( "Invalid port '%s' specified, terminating QueueSvc.", process.argv[ 2 ] );
      process.exit( );
  }

  port = process.argv[ 2 ];
}

app.post( '/put', function( req, res ) {
  queue.enqueue( req.body );
  console.log( "received: %s", req.body.id );
  res.send( { Response : "Added new document to queue: " + req.body.id } );
} )

app.get('/get', function (req, res) {
  var msg = queue.dequeue( );
  if( msg != null ) {
    res.send( { Response : msg.id } );
  }
  else {
    res.send( { Response : 'Empty' } );
  }
})

app.get('/depth', function (req, res) {
  res.send( { Response : queue.getLength( ) } );
})

// build a server instance start waiting on incoming requests on the specified port
var server = app.listen( port, function () {
   console.log("Example app listening at http://%s:%s", utils.getServerIp, port )
})
