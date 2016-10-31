/* Consumer which will take a given json block and perform some operation at
   a specified interval - this is a poll based consumer, which allows for us to
   determine the rate of work based on number of seconds.

   Execution Cmd Line Example:
   node ConsumerApp.js 5000 localhost 8080 8888
*/

// TODO: 1) gracefully deal with a non reacheable queue!
//       3) Refcator serverIp method to common/utils class (cortex pkg)

var http = require( 'http' )
var express = require('express');
var app = express();

// truly <evil> ptimitive type extension ftw!
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
// </evil>

// listen for a sig-exit command from afar (ultra secure mode engaged!)
app.post( '/kill', function( req, res ) {
    isAlive = false;
  console.log( "POST captured, initiating self destruct sequence!" )
  res.send( { Response : "Self termination, initiated ... have a nice day!" } );
} )

// verify cmd line arguments were provided
if( process.argv.length < 6 ) {
    console.error( 'Invalid runtime config, must provide: <delay in ms> <queue host> <queue port> <local kill port>' );
    process.exit( );
}

// initialize consumer app to use a processing delay, specified url and a built-in polling delay
var processingDelay = parseInt( process.argv[ 2 ], 10 ).clamp( 1000, 60000 );
var queueSvcHost = process.argv[ 3 ] ;
var queueSvcPort = parseInt( process.argv[ 4 ] );
var port = parseInt( process.argv[ 5 ] );

// log a statup message to user
console.log( "Starting Consumer using a delay of [%s] for queue: [%s].", processingDelay, queueSvcHost + queueSvcPort )
console.log( "Press any key to exit.")

// capture key presses to exit this app locally
process.stdin.setRawMode(true);
process.stdin.resume();

var isAlive = true;
process.stdin.on( 'data', function( data ) {
    isAlive = false;
    console.log( 'Requesting to exit ConsumerApp ... ' )
} )

// main processing loop - here we poll the queue for the next unit of work
var interval = setInterval( function( ) {
    if( !isAlive ) {
        console.log( 'Finished last job, exiting ConsumerApp!')
        process.exit( )
    }

    var options = {
      host: queueSvcHost,
      port: queueSvcPort,
      path: '/get',
      method: 'GET'
    };

    http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function( chunk ) {
            console.log( 'Request Processed [%s]: ' + chunk, new Date( ).toISOString( ) );
        });
    }).end();
}, processingDelay );

// build a server instance start waiting on incoming requests on the specified port
var server = app.listen( port, function () {
   console.log("Example app listening at http://%s:%s", getServerIp( ), port )
})

/* Returns the best match for machine ip - tries to use an externally addressable
   IP over internal - fails back on 0.0.0.0 */
function getServerIp( ) {
  var os = require('os');
  var ifaces = os.networkInterfaces();
  var values = Object.keys(ifaces).map(function(name) {
    return ifaces[name];
  });
  values = [].concat.apply([], values).filter(function(val){
    return val.family == 'IPv4' && val.internal == false;
  });

  return values.length ? values[0].address : '0.0.0.0';
}
