/*exported CanvasReader*/
var CanvasReader = (function() {
  'use strict';

  function CanvasReader( canvas, x, y, width, height ) {
    canvas = canvas || document.createElement( 'canvas' );

    x = x || 0;
    y = y || 0;
    width = width || canvas.width;
    height = height || canvas.height;

    this.canvas = canvas;
    this.ctx = canvas.getContext( '2d' );
    this.imageData = this.ctx.getImageData( x, y, width, height );

    // Image data properties.
    this.width = this.imageData.width;
    this.height = this.imageData.height;
    this.data = this.imageData.data;
  }

  CanvasReader.prototype.read = function( x, y, width, height ) {
    x = x || 0;
    y = y || 0;
    width = width || 1;
    height = height || 1;

    this.imageData = this.ctx.getImageData( x, y, width, height );
    this.width = this.imageData.width;
    this.height = this.imageData.height;
    this.data = this.imageData.data;
  };

  CanvasReader.prototype.mean = function() {
    var width = this.width,
        height = this.height,
        data = this.data;

    var count = width * height;

    var red   = 0,
        green = 0,
        blue  = 0,
        alpha = 0;

    var x, y;
    var index = 0;
    for ( y = 0; y < height; y++ ) {
      for ( x = 0; x < width; x++ ) {
        red   += data[ index++ ];
        green += data[ index++ ];
        blue  += data[ index++ ];
        alpha += data[ index++ ];
      }
    }

    var color = new Uint8ClampedArray(4);

    color[0] = red   / count;
    color[1] = green / count;
    color[2] = blue  / count;
    color[3] = green / count;

    return color;
  };

  CanvasReader.prototype.median = function() {
    var width = this.width,
        height = this.height,
        data = this.data;

    var count = width * height;

    var red   = new Uint8ClampedArray( count ),
        green = new Uint8ClampedArray( count ),
        blue  = new Uint8ClampedArray( count ),
        alpha = new Uint8ClampedArray( count );

    var x, y;
    var i = 0;
    var index = 0;
    for ( y = 0; y < height; y++ ) {
      for ( x = 0; x < width; x++ ) {
        i++;
        red[i]   = data[ index++ ];
        green[i] = data[ index++ ];
        blue[i]  = data[ index++ ];
        alpha[i] = data[ index++ ];
      }
    }

    var color = new Uint8ClampedArray(4);

    var median = 0.5 * count;
    // Even count.
    var low, high;
    if ( median % 1 ) {
      low = Math.floor( median );
      high = Math.ceil( median );

      color[0] = 0.5 * ( red[   low ] + red[   high ] );
      color[1] = 0.5 * ( green[ low ] + green[ high ] );
      color[2] = 0.5 * ( blue[  low ] + blue[  high ] );
      color[3] = 0.5 * ( alpha[ low ] + alpha[ high ] );
    }
    // Odd count.
    else {
      color[0] = red[   median ];
      color[1] = green[ median ];
      color[2] = blue[  median ];
      color[3] = alpha[ median ];
    }

    return color;
  };

  return CanvasReader;

}) ();
