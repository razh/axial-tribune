/*globals THREE, Promise, requestAnimationFrame*/
(function() {
  'use strict';

  var container;

  var scene, camera, renderer;
  var geometry, mesh, material;

  var data, texture;

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

  var shaderPromises = [];
  var shaderDirectory = '/app/shaders/';

  [
    'particles.vert',
    'particles.frag'
  ].forEach(function( shaderName ) {
    var promise = get( shaderDirectory + shaderName )
      .then(function( shaderData ) {
        console.log( shaderName );
        console.log( shaderData );
        shaders[ shaderName ] = shaderData;
      });

    shaderPromises.push( promise );
  });


  function init() {
    container = document.createElement( 'div' );
    container.classList.add( 'webgl' );
    document.body.appendChild( container );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 4;
    scene.add( camera );

    // Create RGB texture.
    var width = 1024,
        height = 1024;

    data = new Float32Array( width * height * 3 );

    texture = new THREE.DataTexture( data, width, height, THREE.RGBFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    material = new THREE.ShaderMaterial({
      uniforms: {
        // texture: { type: 't', value: texture },
        width: { type: 'f', value: width },
        height: { type: 'f', value: height },

        scale: { type: 'f', value: 128 },

        pointColor: { type: 'v4', value: new THREE.Vector4( 0.5, 0.5, 0.5, 0.5 ) },
        pointSize: { type: 'f', value: 2 }
      },

      vertexShader: shaders[ 'particles.vert' ],
      fragmentShader: shaders[ 'particles.frag' ],

      blending: THREE.AdditiveBlending,
      transparent: true,

      // Avoid z-index artifacts.
      depthWrite: false,
      depthTest: false
    });

    // Create geometry.
    geometry = new THREE.Geometry();

    var vertex;
    for ( var i = 0, il = width * height; i < il; i++ ) {
      vertex = new THREE.Vector3();
      // [0.0, 1.0] parameter along texture.
      vertex.x = ( i % width ) / width;
      vertex.y = Math.floor( i / width ) / height;
      geometry.vertices.push( vertex );
    }

    // Create particle system.
    mesh = new THREE.ParticleSystem( geometry, material );
    scene.add( mesh );
  }

  function animate() {
    render();
    requestAnimationFrame( animate );
  }

  function render() {
    renderer.render( scene, camera );
  }

  Promise.all( shaderPromises ).then(function() {
    init();
    animate();
  });

  window.addEventListener( 'resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  });


  (function() {
    // Websocket.
    var host = window.document.location.host.replace( /:.*/, '' );
    var socket = new WebSocket( 'ws://' + host + ':8080' );
    socket.binaryType = 'arraybuffer';

    var row = 0;
    socket.addEventListener( 'message', function( event ) {
      var data = new Float32Array( event.data );
      draw( context, data, row++ );
      console.log( data.length );
    });

    // Test canvas.
    var canvas  = document.createElement( 'canvas' ),
        context = canvas.getContext( '2d' );

    document.body.appendChild( canvas );

    canvas.width = 128;
    canvas.height = 128;

    function draw( ctx, message, row ) {
      var width  = ctx.canvas.width,
          height = ctx.canvas.height;

      // Loop back.
      row %= height;

      var imageData = ctx.getImageData( 0, 0, width, height ),
          data = imageData.data;

      var index, value;
      for ( var i = 0; i < width; i++ ) {
        index = 4 * ( row * width + i );
        value = 0.5 * ( message[i] + 1 ) * 255;

        data[ index     ] = value;
        data[ index + 1 ] = value;
        data[ index + 2 ] = value;
        data[ index + 3 ] = 255;
      }

      ctx.putImageData( imageData, 0, 0 );
    }
  }) ();
}) ();
