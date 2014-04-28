'use strict';

var SimplexNoise = require( 'simplex-noise' );
var WebSocketServer = require( 'ws' ).Server;
var wss = new WebSocketServer({ port: 8080 });

var simplex = new SimplexNoise();

wss.on( 'connection', function( socket ) {
  function send( index ) {
    var array = new Float32Array( 128 );
    for ( var i = 0, il = array.length; i < il; i++ ) {
      array[i] = simplex.noise2D( index, i );
    }

    socket.send( array.buffer, {
      binary: true
    });
  }

  var interval = process.env.INTERVAL;
  var index = 0;
  if ( interval ) {
    setInterval(function() {
      send( index++ );
    }, interval );
  } else {
    send();
  }
});
