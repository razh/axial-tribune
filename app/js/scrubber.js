/*exported createScrubber*/
function createScrubber( el ) {
  'use strict';

  /**
   * Simplified state object available to all scrubber event listeners.
   */
  var state = {
    mouse: {
      x: 0,
      y: 0,
      down: false
    },

    scrollY: 0,

    keys: [],
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,

    rect: {
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 0
    }
  };

  var callbacks = {};

  [
    'mousedown', 'mousemove', 'mouseup',
    'keydown', 'keyup',
    'wheel'
  ].forEach(function( eventType ) {
    callbacks[ eventType ] = [];
  });

  function stateCallback( callback ) {
    callback( state );
  }

  // Mouse events.
  function mousePosition( event ) {
    state.mouse.x = event.pageX - el.offsetLeft;
    state.mouse.y = event.pageY - el.offsetTop;
  }

  function onMouseDown( event ) {
    state.mouse.down = true;
    mousePosition( event );
    state.rect.x0 = state.rect.x1 = state.mouse.x;
    state.rect.y0 = state.rect.y1 = state.mouse.y;
    callbacks.mousedown.forEach( stateCallback );
  }

  function onMouseMove( event ) {
    mousePosition( event );
    state.rect.x1 = state.mouse.x;
    state.rect.y1 = state.mouse.y;
    callbacks.mousemove.forEach( stateCallback );
  }

  function onMouseUp() {
    state.mouse.down = false;
    mousePosition( event );
    state.rect.x1 = state.mouse.x;
    state.rect.y1 = state.mouse.y;
    callbacks.mouseup.forEach( stateCallback );
  }


  // Key events.
  function modifierKey( event ) {
    state.altKey = event.altKey;
    state.shiftKey = event.shiftKey;
    state.ctrlKey = event.ctrlKey;
    state.metaKey = event.metaKey;
  }

  function onKeyDown( event ) {
    state.keys[ event.keyCode ] = true;
    modifierKey( event );
    callbacks.keydown.forEach( stateCallback );
  }

  function onKeyUp( event ) {
    state.keys[ event.keyCode ] = false;
    modifierKey( event );
    callbacks.keyup.forEach( stateCallback );
  }


  function onScroll( event ) {
    state.scrollY = Math.max( state.scrollY + event.deltaY, 0 );
    callbacks.wheel.forEach( stateCallback );
  }

  el.addEventListener( 'mousedown', onMouseDown );
  el.addEventListener( 'mousemove', onMouseMove );
  el.addEventListener( 'mouseup', onMouseUp );
  el.addEventListener( 'keydown', onKeyDown );
  el.addEventListener( 'keyup', onKeyUp );
  el.addEventListener( 'wheel', onScroll );


  var self = {};

  self.on = function on( eventType, listener ) {
    if ( !callbacks[ eventType ] ) {
      callbacks[ eventType ] = [];
    }

    callbacks[ eventType ].push( listener );
    return self;
  };

  self.off = function off( eventType, listener ) {
    if ( callbacks[ eventType ] ) {
      var index = callbacks[ eventType ].indexOf( listener );
      if ( index !== -1 ) {
        callbacks[ eventType ].splice( index, 1 );
      }
    }

    return self;
  };

  self.destroy = function destroy() {
    el.removeEventListener( 'mousedown', onMouseDown );
    el.removeEventListener( 'mousemove', onMouseMove );
    el.removeEventListener( 'mouseup', onMouseUp );
    el.removeEventListener( 'keydown', onKeyDown );
    el.removeEventListener( 'keyup', onKeyUp );
    el.removeEventListener( 'wheel', onScroll );
  };

  return self;
}
