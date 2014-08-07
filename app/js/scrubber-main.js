/*global requestAnimationFrame*/
(function() {
  'use strict';

  var config = {
    length: 64
  };

  /**
   * There are three canvases:
   *   1. Backing store canvas. (1024x1024)
   *   2. Visible scrubber canvas. (64x512).
   *   3. Output render texture canvas. (64x64)
   */
  var canvas = {};
  var context = {};

  [ 'backingStore', 'scrubber', 'output' ].forEach(function( key ) {
    canvas[ key ] = document.createElement( 'canvas' );
    context[ key ] = canvas[ key ].getContext( '2d' );
  });

  canvas.backingStore.width  = 512;
  canvas.backingStore.height = 512;
  document.body.appendChild( canvas.backingStore );

  canvas.scrubber.width  = 64;
  canvas.scrubber.height = 256;
  document.body.appendChild( canvas.scrubber );

  function connect() {
    // Connect with WebSocket.
    var host = window.location.hostname;
    var socket = new WebSocket( 'ws://' + host + ':8080' );
    socket.binaryType = 'arraybuffer';

    // Set data length to 64.
    socket.addEventListener( 'open', function() {
      socket.send( JSON.stringify( { length: config.length } ) );
    });

    var row = 0;
    socket.addEventListener( 'message', function( event ) {
      var data = new Float32Array( event.data );
      if ( data.length !== config.length ) {
        return;
      }

      drawBackingStore( context.backingStore, data, row++ );
    });
  }

  connect();

  function drawBackingStore( ctx, message, row ) {
    var width  = ctx.canvas.width,
        height = ctx.canvas.height;

    var length = message.length;

    // Loop back.
    row %= Math.floor( width / length ) * height;

    // Buffer row position in backing store.
    var x = Math.floor( row / height ) * length,
        y = row % height;

    var imageData = ctx.getImageData( x, y, length, 1 ),
        data = imageData.data;

    var index, value;
    for ( var i = 0; i < width; i++ ) {
      index = 4 * i;
      value = 0.5 * ( message[i] + 1 ) * 255;

      data[ index     ] = value;
      data[ index + 1 ] = value;
      data[ index + 2 ] = value;
      data[ index + 3 ] = 255;
    }

    ctx.putImageData( imageData, x, y );
  }

  function drawScrubber( ctx, backingCanvas, row ) {
    var width  = ctx.canvas.width,
        height = ctx.canvas.height;

    var backingWidth  = backingCanvas.width,
        backingHeight = backingCanvas.height;

    if ( width > backingWidth || height > backingHeight ) {
      throw new Error( 'Backing store is smaller than scrubber.' );
    }

    // Total number of rows.
    var rowCount = Math.floor( backingWidth / width ) * backingHeight;

    // Initial and final row indices.
    var ri = Math.max( row, 0 ),
        rf = ri + height;

    // Move scrubber back up to fit.
    if ( rf > rowCount ) {
      ri -= rf - rowCount;
      rf = rowCount;
    }

    if ( ri > rf ) {
      return;
    }

    var rxi = Math.floor( ri / backingHeight ) * width,
        ryi = ri % backingHeight;

    var rxf = Math.floor( rf / backingHeight ) * width,
        ryf = rf % backingHeight;

    ctx.clearRect( 0, 0, width, height );

    if ( rxi !== rxf ) {
      /**
       * Scrubber is split across two columns in the backing store:
       *
       *    rxi       rxf
       *     +---------+---------+        ---
       *     |         | / / / / |         |
       *     |         |---------+ ryf     |
       *     |         |         |         |
       * ryi |---------|         |    backingHeight  ---
       *     | / / / / |         |         |          |
       *     |/ / / / /|         |         |     columnHeight
       *     | / / / / |         |         |          |
       *     +---------+---------+        ---        ---
       *
       *     |- width -|
       */
      var columnHeight = backingHeight - ryi;

      ctx.drawImage(
        backingCanvas,
        rxi, ryi, width, columnHeight,
          0,   0, width, columnHeight
      );

      ctx.drawImage(
        backingCanvas,
        rxf,            0, width, ryf,
          0, columnHeight, width, ryf
      );
    } else {
      // Scrubber is in one column.
      ctx.drawImage(
        backingCanvas,
        rxi, ryi, width, height,
        0, 0, width, height
      );
    }
  }

}) ();
