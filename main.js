import * as THREE from 'three';
import world from './assets/world.json';

import Stats from 'three/addons/libs/stats.module.js';

import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let container, stats;

let camera, controls, scene, renderer;

const worldWidth = world[0].length;
const worldDepth = world.length;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;

console.log('world', worldWidth, worldDepth);

const clock = new THREE.Clock();

init();
animate();

function init() {
  container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    200000
  );
  camera.position.y = 10 * world.length;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  // sides

  const matrix = new THREE.Matrix4();

  const pxGeometry = new THREE.PlaneGeometry(100, 100);
  pxGeometry.attributes.uv.array[1] = 0.5;
  pxGeometry.attributes.uv.array[3] = 0.5;
  pxGeometry.rotateY(Math.PI / 2);
  pxGeometry.translate(50, 0, 0);

  const nxGeometry = new THREE.PlaneGeometry(100, 100);
  nxGeometry.attributes.uv.array[1] = 0.5;
  nxGeometry.attributes.uv.array[3] = 0.5;
  nxGeometry.rotateY(-Math.PI / 2);
  nxGeometry.translate(-50, 0, 0);

  const pyGeometry = new THREE.PlaneGeometry(100, 100);
  pyGeometry.attributes.uv.array[5] = 0.5;
  pyGeometry.attributes.uv.array[7] = 0.5;
  pyGeometry.rotateX(-Math.PI / 2);
  pyGeometry.translate(0, 50, 0);

  const pzGeometry = new THREE.PlaneGeometry(100, 100);
  pzGeometry.attributes.uv.array[1] = 0.5;
  pzGeometry.attributes.uv.array[3] = 0.5;
  pzGeometry.translate(0, 0, 50);

  const nzGeometry = new THREE.PlaneGeometry(100, 100);
  nzGeometry.attributes.uv.array[1] = 0.5;
  nzGeometry.attributes.uv.array[3] = 0.5;
  nzGeometry.rotateY(Math.PI);
  nzGeometry.translate(0, 0, -50);

  //

  const landBlocks = [];
  const seaBlocks = [];

  for (let z = 0; z < world.length; z++) {
    for (let x = 0; x < world[0].length; x++) {
      const h = getY(x, z);

      matrix.makeTranslation(
        x * 100 - worldHalfWidth * 100,
        h * 100,
        z * 100 - worldHalfDepth * 100
      );

      const px = getY(x + 1, z);
      const nx = getY(x - 1, z);
      const pz = getY(x, z + 1);
      const nz = getY(x, z - 1);

      const geometries = h === 1 ? seaBlocks : landBlocks;

      geometries.push(pyGeometry.clone().applyMatrix4(matrix));

      if ((px !== h && px !== h + 1) || x === 0) {
        geometries.push(pxGeometry.clone().applyMatrix4(matrix));
      }

      if ((nx !== h && nx !== h + 1) || x === worldWidth - 1) {
        geometries.push(nxGeometry.clone().applyMatrix4(matrix));
      }

      if ((pz !== h && pz !== h + 1) || z === worldDepth - 1) {
        geometries.push(pzGeometry.clone().applyMatrix4(matrix));
      }

      if ((nz !== h && nz !== h + 1) || z === 0) {
        geometries.push(nzGeometry.clone().applyMatrix4(matrix));
      }
    }
  }

  {
    const land = BufferGeometryUtils.mergeGeometries(landBlocks);
    land.computeBoundingSphere();

    const dirt = new THREE.TextureLoader().load('assets/atlas.png');
    dirt.colorSpace = THREE.SRGBColorSpace;
    dirt.magFilter = THREE.NearestFilter;

    scene.add(
      new THREE.Mesh(
        land,
        new THREE.MeshLambertMaterial({
          map: dirt,
          side: THREE.DoubleSide,
        })
      )
    );
  }

  {
    const sea = BufferGeometryUtils.mergeGeometries(seaBlocks);
    sea.computeBoundingSphere();

    const water = new THREE.TextureLoader().load('assets/water.png');
    water.colorSpace = THREE.SRGBColorSpace;
    water.magFilter = THREE.NearestFilter;

    scene.add(
      new THREE.Mesh(
        sea,
        new THREE.MeshLambertMaterial({
          map: water,
          side: THREE.DoubleSide,
        })
      )
    );
  }

  const ambientLight = new THREE.AmbientLight(0xeeeeee, 3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 12);
  directionalLight.position.set(1, 1, 0.5).normalize();
  scene.add(directionalLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new FirstPersonControls(camera, renderer.domElement);

  controls.movementSpeed = 1000;
  controls.lookSpeed = 0.125;
  controls.lookVertical = true;

  stats = new Stats();
  container.appendChild(stats.dom);

  //

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  controls.handleResize();
}

function getY(x, z) {
  if (x < 0 || x >= world[0].length) return 0;
  if (z < 0 || z >= world.length) return 0;
  return world[Math.ceil(z)][Math.ceil(x)] === ' ' ? 2 : 1;
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
}
