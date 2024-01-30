// Simple three.js example

import * as THREE from "https://unpkg.com/three@0.112/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.112/examples/jsm/controls/OrbitControls.js";

var mesh, renderer, scene, camera, controls;

init();
animate();

function init() {

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild( renderer.domElement );

    // scene
    scene = new THREE.Scene();
    
    // camera
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 20, 20, 20 );

    // controls
    controls = new OrbitControls( camera, renderer.domElement );
    
    // ambient
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    
    // light
    var light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 20,20, 0 );
    scene.add( light );
    
    // axes
    scene.add( new THREE.AxesHelper( 20 ) );

    // geometry
    var geometry = new THREE.SphereGeometry( 5, 120, 100 );
    
    // material
    var material = new THREE.MeshPhongMaterial( {
        color: 0x00ffff, 
        flatShading: true,
        transparent: true,
        opacity: 0.7,
    } );
    
    // mesh
    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

	// particles
	var particlesGeometry = new THREE.Geometry();
	var particlesMaterial = new THREE.PointsMaterial({
		color: 0xffffff,
		size: 10,
		transparent: true,
		opacity: 0.7
	});

	// Assuming you have an array of country locations with latitude and longitude
	var countryLocations = [
        { lat: 52.3676, lon: 4.9041 }, // Netherlands
        // { lat: 50.8503, lon: 4.3517 }, // Belgium
        // ... Add all other countries
    ];

	countryLocations.forEach(function(location) {
		var position = latLongToVector3(location.lat, location.lon, 5); // Replace '5' with your sphere radius
		particlesGeometry.vertices.push(position);
	});


	// Add particles to represent locations
	// For now, let's just add random particles
	// for (var i = 0; i < 1000; i++) {
	// 	var vertex = new THREE.Vector3();
	// 	vertex.x = Math.random() * 10 - 5;
	// 	vertex.y = Math.random() * 10 - 5;
	// 	vertex.z = Math.random() * 10 - 5;
	// 	particlesGeometry.vertices.push(vertex);
	// }

	var particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
	scene.add(particlesMesh);
    
}

function latLongToVector3(latitude, longitude, radius) {
    var phi = (latitude)*Math.PI/180;
    var theta = (longitude-180)*Math.PI/180;

    var x = -(radius) * Math.cos(phi) * Math.cos(theta);
    var y = (radius) * Math.sin(phi);
    var z = (radius) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}


function animate() {

    requestAnimationFrame( animate );
    
    // particleSystem.rotation.y += 0.01;

    controls.update();

    renderer.render( scene, camera );

}
