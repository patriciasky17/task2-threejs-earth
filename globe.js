import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer.js';

let rad = 5;

const globalUniforms = {
    time: { type: 'f', value: 0 }
};

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(10.5, 5.5, 1).setLength(14);
camera.lookAt(scene.position);
var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setClearColor(0x252025);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// var controls = new OrbitControls(camera, renderer.domElement);

let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

window.addEventListener("resize", onWindowResize);

let controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed *= 0.5;

var geom = new THREE.SphereBufferGeometry(5, 180, 90);
var colors = [];
var color = new THREE.Color();
var q = ["white", "gray", "gray", "gray", "cornsilk", "cornsilk", "cornsilk"];
for (let i = 0; i < geom.attributes.position.count; i++) {
    color.set(q[THREE.Math.randInt(0, q.length - 1)]);
    color.toArray(colors, i * 3);
}
geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

var loader = new THREE.TextureLoader();
loader.setCrossOrigin('');
var texture = loader.load('https://cywarr.github.io/small-shop/earthspec1k[1].jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 1);
var disk = loader.load('https://threejs.org/examples/textures/sprites/circle.png');

var points = new THREE.Points(geom, new THREE.ShaderMaterial({
    vertexColors: THREE.VertexColors,
    uniforms: {
        visibility: {
            value: texture
        },
        shift: {
            value: 0
        },
        shape: {
            value: disk
        },
        size: {
            value: 0.1
        },
        scale: {
            value: window.innerHeight / 3
        }
    },
    vertexShader: `          
        uniform float scale;
        uniform float size;
        
        varying vec2 vUv;
        varying vec3 vColor;
        
        void main() {
        
            vUv = uv;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size * ( scale / length( mvPosition.xyz )) * (0.3 + sin(uv.y * 3.1415926) * 0.6 );
            gl_Position = projectionMatrix * mvPosition;

        }
    `,
    fragmentShader: `
        uniform sampler2D visibility;
        uniform float shift;
        uniform sampler2D shape;
        
        varying vec2 vUv;
        varying vec3 vColor;
        

        void main() {
            
            vec2 uv = vUv;
            uv.x += shift;
            vec4 v = texture2D(visibility, uv);
            if (length(v.rgb) > 1.0) discard;

            gl_FragColor = vec4( vColor, 1.0 );
            vec4 shapeData = texture2D( shape, gl_PointCoord );
            if (shapeData.a < 0.0625) discard;
            gl_FragColor = gl_FragColor * shapeData;
            
        }
    `,
    transparent: false
}));
scene.add(points);


var blackGlobe = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
    color: 0x100A0E
}));
blackGlobe.scale.setScalar(0.99);
points.add(blackGlobe);

// Marker


// <Markers>
// Replace markerCount with the number of countries you have
const markerCount = 9;

// Define the latitude and longitude for each country
const countryCoordinates = [
    { name: "Netherlands", lat: 52.1326, lon: 5.2913 }, // Netherlands
    { name: "Belgium", lat: 50.5039, lon: 4.4699 }, // Belgium
    { name: "Germany", lat: 51.1657, lon: 10.4515 }, // Germany
    { name: "Austria", lat: 47.5162, lon: 14.5501 }, // Austria
    { name: "Sweden", lat: 60.1282, lon: 18.6435 }, // Sweden
    { name: "Finland", lat: 61.9241, lon: 25.7482 }, // Finland
    { name: "Norway", lat: 60.4720, lon: 8.4689 },  // Norway
    { name: "Denmark", lat: 56.2639, lon: 9.5018 },  // Denmark
    { name: "UK", lat: 55.3781, lon: -3.4360 }, // UK
];

let markerInfo = []; // information on markers
let gMarker = new THREE.PlaneGeometry();
let mMarker = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    uniforms: {
        time: globalUniforms.time,
    },
    onBeforeCompile: (shader) => {
        shader.uniforms.time = globalUniforms.time;
        shader.vertexShader = `
        attribute float phase;
        varying float vPhase;
        ${shader.vertexShader}
    `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
      	vPhase = phase; // de-synch of ripples
    `
        );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
        uniform float time;
        varying float vPhase;
        ${shader.fragmentShader}
    `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `
        vec2 lUv = (vUv - 0.5) * 4.;
        float val = 0.;
        float lenUv = length(lUv);
        val = max(val, 1. - step(0.25, lenUv)); // central circle
        val = max(val, step(0.4, lenUv) - step(0.5, lenUv)); // outer circle
        
        float tShift = fract(time * 0.5 + vPhase);
        val = max(val, step(0.4 + (tShift * 0.6), lenUv) - step(0.5 + (tShift * 0.5), lenUv)); // ripple
        
        if (val < 0.5) discard;
        
        vec4 diffuseColor = vec4( diffuse, opacity );`
        );
        //console.log(shader.fragmentShader)
    }
});
mMarker.defines = { USE_UV: " " }; // needed to be set to be able to work with UVs
let markers = new THREE.InstancedMesh(gMarker, mMarker, markerCount);

let dummy = new THREE.Object3D();
let phase = [];
for (let i = 0; i < markerCount; i++) {
    let pos = latLongToVector3(
        countryCoordinates[i].lat,
        countryCoordinates[i].lon,
        rad // Replace with the radius of your globe
    );
    
    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.lookAt(dummy.position.clone().setLength(rad + 1));
    dummy.updateMatrix();
    markers.setMatrixAt(i, dummy.matrix);
    phase.push(1);

    markerInfo.push({
        id: countryCoordinates[i].name,
        latitude: countryCoordinates[i].lat,
        longitude: countryCoordinates[i].lon,
        crd: dummy.position.clone()
    });
}
gMarker.setAttribute(
    "phase",
    new THREE.InstancedBufferAttribute(new Float32Array(phase), 1, true)
);

scene.add(markers);

// Marker End

// <Label>
let labelDiv = document.getElementById("markerLabel");
let closeBtn = document.getElementById("closeButton");
closeBtn.addEventListener("pointerdown", event => {
  labelDiv.classList.add("hidden");
})
let label = new CSS2DObject(labelDiv);
label.userData = {
  cNormal: new THREE.Vector3(),
  cPosition: new THREE.Vector3(),
  mat4: new THREE.Matrix4(),
  trackVisibility: () => { // the closer to the edge, the less opacity
    let ud = label.userData;
    ud.cNormal.copy(label.position).normalize().applyMatrix3(points.normalMatrix);
    ud.cPosition.copy(label.position).applyMatrix4(ud.mat4.multiplyMatrices(camera.matrixWorldInverse, points.matrixWorld));
    let d = ud.cPosition.negate().normalize().dot(ud.cNormal);
    d = smoothstep(0.2, 0.7, d);
    label.element.style.opacity = d;
    
    // https://github.com/gre/smoothstep/blob/master/index.js
    function smoothstep (min, max, value) {
      var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
      return x*x*(3 - 2*x);
    };
  }
}
scene.add(label);

// Label End

// <Interaction>
let pointer = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let intersections;
let divID = document.getElementById("idNum");
let divMag = document.getElementById("magnitude");
let divCrd = document.getElementById("coordinates");
window.addEventListener("pointerdown", event => {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  intersections = raycaster.intersectObject(markers).filter(m => {
    return (m.uv.subScalar(0.5).length() * 2) < 0.25; // check, if we're in the central circle only
  });
  //console.log(intersections);
  if (intersections.length > 0) {
    let iid = intersections[0].instanceId;
    let mi = markerInfo[iid];
    divID.innerHTML = `Name: <b>${mi.id}</b>`;
    divMag.innerHTML = `Latitude: <b>${mi.latitude}</b>`;
    divCrd.innerHTML = `Longitude: <b>${mi.longitude}</b>`;
    // divCrd.innerHTML = `X: <b>${mi.crd.x.toFixed(2)}</b>; Y: <b>${mi.crd.y.toFixed(2)}</b>; Z: <b>${mi.crd.z.toFixed(2)}</b>`;
    label.position.copy(mi.crd);
    label.element.animate([
      {width: "0px", height: "0px", marginTop: "0px", marginLeft: "0px"},
      {width: "230px", height: "50px", marginTop: "-10px", maginLeft: "120px"}
    ],{
      duration: 250
    });
    label.element.classList.remove("hidden");
  }
  
})
// </Interaction>


var clock = new THREE.Clock();
var time = 0;

render();

function render() {
    requestAnimationFrame(render);
    label.userData.trackVisibility();
    globalUniforms.time.value = performance.now() / 1000; // Convert milliseconds to seconds
    // time += clock.getDelta();
    points.material.uniforms.shift.value = -time * 0.1;
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function latLongToVector3(latitude, longitude, radius) {
    var phi = (latitude) * Math.PI / 180;
    var theta = (longitude - 180) * Math.PI / 180;

    var x = -(radius) * Math.cos(phi) * Math.cos(theta);
    var y = (radius) * Math.sin(phi);
    var z = (radius) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

function onWindowResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
    labelRenderer.setSize(innerWidth, innerHeight);
}