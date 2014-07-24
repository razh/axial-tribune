/*globals THREE, Promise, requestAnimationFrame*/
(function() {
  'use strict';

  var container;

  var scene, camera, controls, renderer;
  var textureGeometry, textureMaterial, textureMesh;
  var pointGeometry, pointMaterial, pointMesh;
  var sphereGeometry, sphereMaterial, sphere;
  var projector;

  var canvas, context;
  var texture;

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

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1e4 );
    controls = new THREE.OrbitControls( camera, renderer.domElement );

    var scale = 256;
    var halfScale = 0.5 * scale;

    var width = 128,
        height = 128;

    camera.position.set( halfScale, halfScale, scale );
    controls.target.set( halfScale, halfScale, 0 );
    controls.update();

    scene.add( camera );

    canvas = document.createElement( 'canvas' );
    context = canvas.getContext( '2d' );
    canvas.width = 128;
    canvas.height = 128;
    document.body.appendChild( canvas );
    texture = new THREE.Texture( canvas );
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    /**
     * Two update methods:
     *   - Texture updates read by the vertex shader.
     *   - Update vertices directly.
     */
    textureMaterial = new THREE.ShaderMaterial({
      uniforms: {
        texture: { type: 't', value: texture },
        width: { type: 'f', value: width },
        height: { type: 'f', value: height },

        scale: { type: 'v3', value: new THREE.Vector3( scale, scale, scale ) },

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

    // Create texture-based geometry.
    textureGeometry = new THREE.Geometry();

    var vertex;
    var i, il;
    for ( i = 0, il = width * height; i < il; i++ ) {
      vertex = new THREE.Vector3();
      // [0.0, 1.0] parameter along texture.
      vertex.x = ( i % width ) / width;
      vertex.y = Math.floor( i / width ) / height;
      textureGeometry.vertices.push( vertex );
    }

    // Create point cloud.
    textureMesh = new THREE.PointCloud( textureGeometry, textureMaterial );
    textureMesh.frustumCulled = false;
    textureMesh.visible = true;
    scene.add( textureMesh );


    // Create mesh with direct vertex update.
    pointMaterial = new THREE.PointCloudMaterial({
      blending: THREE.AdditiveBlending,
      transparent: true,

      color: new THREE.Color( 0.5, 0.5, 0.5 ),
      opacity: 0.5,

      size: 2,
      sizeAttenuation: false
    });

    pointGeometry = new THREE.Geometry();

    for ( i = 0, il = width * height; i <  il; i++ ) {
      vertex = new THREE.Vector3();
      vertex.x = 2 * ( i % width );
      vertex.y = 2 * Math.floor( i / width );
      pointGeometry.vertices.push( vertex );
    }

    pointMesh = new THREE.PointCloud( pointGeometry, pointMaterial );
    pointMesh.sortParticles = true;
    pointMesh.visible = false;
    // scene.add( pointMesh );


    // Projector.
    projector = new THREE.Projector();

    // Debug sphere.
    sphereGeometry = new THREE.SphereGeometry( 2, 4, 4 );
    sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ff88,
      opacity: 0.5,

      wireframe: true,
      transparent: true
    });
    sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.visible = pointMesh.visible;
    scene.add( sphere );
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

  window.addEventListener( 'mousemove', function( event ) {
    if ( !pointMesh || !pointMesh.visible ) {
      return;
    }

    // Calculate intersection.
    var vector = new THREE.Vector3(
      ( event.pageX / window.innerWidth ) * 2 - 1,
      -( event.pageY / window.innerHeight ) * 2 + 1,
      0
    );

    projector.unprojectVector( vector, camera );

    var raycaster = new THREE.Raycaster(
      camera.position,
      vector.sub( camera.position ).normalize()
    );

    var intersections = raycaster.intersectObject( pointMesh );
    if ( intersections[0] ) {
      sphere.position.copy( intersections[0].point );
    }
  });

  window.addEventListener( 'resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  });


  (function() {
    // Display the length of the arraybuffer returned by the websocket.
    var dataLengthEl = document.querySelector( '.js-data-length' );

    // Websocket.
    var host = window.document.location.host.replace( /:.*/, '' );
    var socket = new WebSocket( 'ws://' + host + ':8080' );
    socket.binaryType = 'arraybuffer';

    var row = 0;
    socket.addEventListener( 'message', function( event ) {
      if ( !context ) {
        return;
      }

      var data = new Float32Array( event.data );
      draw( context, data, row++ );
      dataLengthEl.textContent = data.length;
    });

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

        index = ( height - row - 1 ) * width + i;
        pointGeometry.vertices[ index ].z = message[i] * 64;
      }

      ctx.putImageData( imageData, 0, 0 );
      texture.needsUpdate = true;
      pointGeometry.verticesNeedUpdate = true;
    }
  }) ();
}) ();
