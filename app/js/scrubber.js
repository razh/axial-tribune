/*exported scrubber*/
function scrubber( el ) {
  'use strict';

  function onMouseDown() {}
  function onMouseMove() {}
  function onMouseUp() {}

  el.addEventListener( 'mousedown', onMouseDown );
  el.addEventListener( 'mousemove', onMouseMove );
  el.addEventListener( 'mouseup', onMouseUp );

  function destroy() {
    el.removeEventListener( 'mousedown', onMouseDown );
    el.removeEventListener( 'mousemove', onMouseMove );
    el.removeEventListener( 'mouseup', onMouseUp );
  }

  return {
    destroy: destroy
  };
}
