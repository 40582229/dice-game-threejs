import * as THREE from "three";
import { loader } from "../../helpers";

export const createGround = (scene) => {
  const colorTexture = loader.load("textures/ground/ground.jpg");
  const normalMap = loader.load("textures/ground/normal.png");
  const roughnessMap = loader.load("textures/ground/rough.png");
  const aoMap = loader.load("textures/ground/ao.png");
  const displacementMap = loader.load("textures/ground/displacement.png");

  // IMPORTANT: repeat textures (ground should tile)
  [colorTexture, normalMap, roughnessMap, aoMap, displacementMap].forEach(
    (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 5);
      t.rotation = Math.random() * Math.PI;
      t.center.set(0.5, 0.5);
    },
  );

  // geometry must have segments for displacement + AO
  const geometry = new THREE.PlaneGeometry(150, 150, 100, 100);

  // AO needs second UV set
  geometry.setAttribute(
    "uv2",
    new THREE.BufferAttribute(geometry.attributes.uv.array, 2),
  );

  const material = new THREE.MeshStandardMaterial({
    map: colorTexture,

    normalMap: normalMap,
    normalScale: new THREE.Vector2(2, 2),

    roughnessMap: roughnessMap,
    roughness: 1, // fallback if map fails

    aoMap: aoMap,
    aoMapIntensity: 3,

    displacementMap: displacementMap,
    displacementScale: 1, // lower = more realistic
    displacementBias: 0,

    metalness: 0.9, 
    envMapIntensity: 0.9, // subtle reflections
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -1;

  scene.add(mesh);
};
