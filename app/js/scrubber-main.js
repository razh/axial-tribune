(function() {
  'use strict';

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

  function connect() {
    // Connect with WebSocket.
    var host = window.location.hostname;
    var socket = new WebSocket( 'ws://' + host + ':8080' );
    socket.binaryType = 'arraybuffer';

    // Set data length to 64.
    socket.addEventListener( 'open', function() {
      socket.send( JSON.stringify( { length: 64 } ) );
    });

    var row = 0;
    socket.addEventListener( 'message', function( event ) {
      var data = new Float32Array( event.data );
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

}) ();
