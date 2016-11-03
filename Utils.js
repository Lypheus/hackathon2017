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

exports.getServerIp = getServerIp()
