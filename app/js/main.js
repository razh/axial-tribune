/*globals THREE, requestAnimationFrame*/
(function() {
  'use strict';

  var container;

  var scene, camera, renderer;

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

  init();
  animate();

  window.addEventListener( 'resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  });

}) ();
