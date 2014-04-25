/*globals THREE, Promise, requestAnimationFrame*/
(function() {
  'use strict';

  var container;

  var scene, camera, renderer;

  var shaders = {};

  function get( url ) {
    return new Promise(function( resolve, reject ) {
      var xhr = new XMLHttpRequest();
      xhr.open( 'GET', url );

      xhr.onload = function() {
        if (xhr.status === 200 ) {
          resolve( xhr.response );
        } else {
          reject( new Error( xhr.statusText ) );
        }
      };

      xhr.onerror = function() {
        reject( new Error( xhr.statusText ) );
      };

      xhr.send();
    });
  }

  var promises = [];
  var directory = '/app/shaders/';

  [
    'particles.vert',
    'particles.frag'
  ].forEach(function( name ) {
    var promise = get( directory + name )
      .then(function( data ) {
        console.log( name );
        console.log( data );
        shaders[ name ] = data;
      });

    promises.push( promise );
  });


  function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    scene.add( camera );
  }

  function animate() {
    render();
    requestAnimationFrame( animate );
  }

  function render() {
  }

  Promise.all( promises ).then(function() {
    init();
    animate();
  });

  window.addEventListener( 'resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  });


  // Websocket.
  var host = window.document.location.host.replace( /:.*/, '' );
  var socket = new WebSocket( 'ws://' + host + ':8080' );
  socket.binaryType = 'arraybuffer';

  socket.addEventListener( 'message', function( event ) {
    var data = new Float32Array( event.data );
    console.log( data.length );
  });
}) ();
