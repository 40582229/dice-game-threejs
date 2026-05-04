import * as CANNON from "cannon-es";
import * as THREE from "three";
import { loader } from "../../helpers";
export const createCasinoBucket = ({
  radius,
  height,
  segments,
  scene,
  world,
  defaultMaterial,
  wallMaterial,
}) => {
  const wallThickness = 0.4;
  const material = new THREE.MeshStandardMaterial({
    color: 0x999999,
  });

  const floorMesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    material,
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  floorMesh.castShadow = true;

  const floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: defaultMaterial,
  });
  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(floorBody);

  const roofBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: defaultMaterial,
  });
  roofBody.position.y = height;
  roofBody.quaternion.setFromEuler(Math.PI / 2, 0, 0);
  world.addBody(roofBody);

  const angleStep = (Math.PI * 2) / segments;

  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;

    // Position on circle
    const x = Math.cos(angle - 1.57) * radius;
    const z = Math.sin(angle - 1.57) * radius;

    // Wall length equals arc width
    const wallWidth = 2.2 * radius * Math.tan(Math.PI / segments + 0.1);

    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, height, wallThickness),
      material,
    );

    wallMesh.position.set(x, height / 2, z);
    wallMesh.rotation.y = -angle;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;

    scene.add(wallMesh);

    const wallBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(wallWidth / 2, height / 2, wallThickness / 2),
      ),
      material: wallMaterial,
    });

    wallBody.position.set(x, height / 2, z);
    wallBody.quaternion.setFromEuler(0, -angle, 0);

    world.addBody(wallBody);
  }

  const colorTexture = loader.load("textures/wall/wall.jpg");
  const normalMap = loader.load("textures/wall/normal.png");
  const roughnessMap = loader.load("textures/wall/rough.png");
  const aoMap = loader.load("textures/wall/ao.png");
  const displacementMap = loader.load("textures/wall/displacement.png");

  const outerRadius = radius + 0.4;
  const cylinderHeight = height + 4;

  const circumference = 2 * Math.PI * outerRadius;

  // adjust this depending on how big one texture tile should look
  const textureWorldSize = 32;

  const repeatX = circumference / textureWorldSize;
  const repeatY = cylinderHeight / textureWorldSize;

  [colorTexture, normalMap, roughnessMap, aoMap, displacementMap].forEach(
    (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;

      t.repeat.set(repeatX, repeatY);
      t.center.set(0.5, 0.5);
    },
  );

  const cylinderMaterial = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    map: colorTexture,

    normalMap: normalMap,
    normalScale: new THREE.Vector2(2, 2),

    roughnessMap: roughnessMap,
    roughness: 1, // fallback if map fails

    aoMap: aoMap,
    aoMapIntensity: 3,

    displacementMap: displacementMap,
    displacementScale: 0, // lower = more realistic
    displacementBias: 0,

    metalness: 1,
    envMapIntensity: 0.9, // subtle reflections
  });

  const cylinderGeomtry = new THREE.CylinderGeometry(
    radius + 0.4,
    radius + 0.4,
    height + 2,
    32,
    1,
    true,
  );
  cylinderGeomtry.setAttribute(
    "uv2",
    new THREE.BufferAttribute(cylinderGeomtry.attributes.uv.array, 2),
  );
  const cilinderMesh = new THREE.Mesh(cylinderGeomtry, cylinderMaterial);
  cilinderMesh.position.y += 4;
  const innerCylinderGeomtry = new THREE.CylinderGeometry(
    radius - 0.2,
    radius - 0.2,
    height + 2,
    32,
    1,
    true,
  );
  const innerCilinderMesh = new THREE.Mesh(
    innerCylinderGeomtry,
    cylinderMaterial,
  );
  innerCilinderMesh.position.y += 4;
  scene.add(cilinderMesh);
  scene.add(innerCilinderMesh);

  // Clone textures for rim so it can have separate UV/repeat settings
  const rimColor = colorTexture.clone();
  const rimNormal = normalMap.clone();
  const rimRough = roughnessMap.clone();
  const rimAO = aoMap.clone();

  const rimRadius = outerRadius - 0.15;
  const rimTubeRadius = 0.4;

  const rimCircumference = 2 * Math.PI * rimRadius;
  const rimTubeCircumference = 2 * Math.PI * rimTubeRadius;

  const rimRepeatX = rimCircumference / textureWorldSize;
  const rimRepeatY = rimTubeCircumference / textureWorldSize;

  [rimColor, rimNormal, rimRough, rimAO].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;

    t.repeat.set(rimRepeatX, rimRepeatY);
    t.center.set(0.5, 0.5);
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    map: rimColor,

    normalMap: rimNormal,
    normalScale: new THREE.Vector2(2, 2),

    roughnessMap: rimRough,
    roughness: 1,

    aoMap: rimAO,
    aoMapIntensity: 3,

    metalness: 1,
    envMapIntensity: 0.9,
  });

  const rimGeometry = new THREE.TorusGeometry(rimRadius - 0.2, rimTubeRadius , 16, 64);

  rimGeometry.setAttribute(
    "uv2",
    new THREE.BufferAttribute(rimGeometry.attributes.uv.array, 2),
  );
  const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);

  // top of your cylinder
  rimMesh.position.y = 4 + (height + 2) / 2;
  rimMesh.rotation.x = Math.PI / 2;
  scene.add(rimMesh);
};
