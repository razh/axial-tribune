'use strict';

var SimplexNoise = require( 'simplex-noise' );
var WebSocketServer = require( 'ws' ).Server;
var wss = new WebSocketServer({ port: 8080 });

var simplex = new SimplexNoise();

wss.on( 'connection', function( socket ) {
  var intervalId;

  function send( index ) {
    var array = new Float32Array( 128 );
    for ( var i = 0, il = array.length; i < il; i++ ) {
      array[i] = simplex.noise2D( index, i );
    }

    try {
      socket.send( array.buffer, {
        binary: true
      });
    } catch ( error ) {
      console.log( error );
      if ( intervalId ) {
        clearInterval( intervalId );
      }
    }
  }

  var interval = process.env.INTERVAL;
  var index = 0;
  if ( interval ) {
    intervalId = setInterval(function() {
      send( index++ );
    }, interval );
  } else {
    send();
  }
});
