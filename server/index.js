'use strict';

var SimplexNoise = require( 'simplex-noise' );
var WebSocketServer = require( 'ws' ).Server;
var wss = new WebSocketServer({ port: 8080 });

var simplex = new SimplexNoise();

function log2( x ) {
  return Math.log( x ) / Math.LN2;
}

var config = {};

function setLength( length ) {
  config.length = length || 128;
  config.octaves = Math.ceil( log2( config.length ) );
  config.period = 0.5 * config.length;
}

setLength( process.env.LENGTH );

wss.on( 'connection', function( socket ) {
  var intervalId;

  socket.on( 'message', function( message ) {
    message = JSON.parse( message );
    var length = parseInt( message.length, 10 );
    if ( length ) {
      setLength( length );
    }
  });

  /**
   * - Octave determines the granularity of the fbm.
   * - Period determines the "size" of the perturbations. Higher periods result
   *   in larger mountains. A smaller period results in many hills.
   * - Lacunarity is the frequency multiplier (e.g., harmonics).
   * - Gain determines the amplitude contrast. Higher gains result in greater
   *   contrast.
   *
   * A lacunarity of 2 and gain of 0.5 is 1/f noise.
   */
  function fbm( x, y, octaves, period, lacunarity, gain ) {
    octaves = octaves || 16;
    period = period || 256;
    lacunarity = lacunarity || 2;
    gain = gain || 0.5;

    var frequency = 1 / period;
    var amplitude = gain;

    var sum = 0;
    for ( var i = 0; i < octaves; i++ ) {
      sum += amplitude * simplex.noise2D( x * frequency, y * frequency );
      frequency *= lacunarity;
      amplitude *= gain;
    }

    return sum;
  }

  function send( index ) {
    var array = new Float32Array( config.length );
    // For 128 pixels, 8 octaves is 0.5 pixel resolution (log2(128) is 8).
    for ( var i = 0, il = array.length; i < il; i++ ) {
      array[i] = fbm( index, i, config.octaves, config.period );
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
