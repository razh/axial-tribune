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

  /**
   * Fractional Brownian motion with domain warping.
   *
   * From Inigo Quilez's article:
   *
   *   http://www.iquilezles.org/www/articles/warp/warp.htm
   */
  function pattern( px, py, octaves, period, lacunarity, gain ) {
    // fbm( p ).
    var qx = fbm( px,       py,       octaves, period, lacunarity, gain ),
        qy = fbm( px + 5.2, py + 1.3, octaves, period, lacunarity, gain );

    // Temporary vec2.
    var tx = px + period * qx,
        ty = py + period * qy;

    // fbm( p + fbm( p ) ).
    var rx = fbm( tx + 1.7, ty + 9.2, octaves, period, lacunarity, gain ),
        ry = fbm( tx + 8.3, ty + 2.8, octaves, period, lacunarity, gain );

    // fbm( p + fbm( p + fbm( p ) ) ).
    return fbm( px + period * rx, py + period * ry, octaves, period, lacunarity, gain );
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
