import * as CANNON from "cannon-es";
import * as THREE from "three";

import { bettingPairs, faceValues } from "../../constants";

// Create dot texture for each face (1-6)
const createDotTexture = (faceNumber) => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#000000";
  const dotRadius = size / 12;
  const positions = {
    1: [[size / 2, size / 2]],
    2: [
      [size / 4, size / 4],
      [(3 * size) / 4, (3 * size) / 4],
    ],
    3: [
      [size / 4, size / 4],
      [size / 2, size / 2],
      [(3 * size) / 4, (3 * size) / 4],
    ],
    4: [
      [size / 4, size / 4],
      [(3 * size) / 4, size / 4],
      [size / 4, (3 * size) / 4],
      [(3 * size) / 4, (3 * size) / 4],
    ],
    5: [
      [size / 4, size / 4],
      [(3 * size) / 4, size / 4],
      [size / 2, size / 2],
      [size / 4, (3 * size) / 4],
      [(3 * size) / 4, (3 * size) / 4],
    ],
    6: [
      [size / 4, size / 4],
      [(3 * size) / 4, size / 4],
      [size / 4, size / 2],
      [(3 * size) / 4, size / 2],
      [size / 4, (3 * size) / 4],
      [(3 * size) / 4, (3 * size) / 4],
    ],
  };

  for (const [x, y] of positions[faceNumber]) {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
};

// Create materials for each face with proper dot textures
const diceMaterials = faceValues.map(
  (faceNum) =>
    new THREE.MeshStandardMaterial({
      map: createDotTexture(faceNum),
      roughness: 0.4,
      metalness: 0.1,
    }),
);

export const createDice = ({ x, y, z, world, scene, defaultMaterial }) => {
  const shape = new CANNON.Box(new CANNON.Vec3(0.9999, 0.9999, 0.9999));
  const body = new CANNON.Body({
    mass: 2.5,
    shape,
    material: defaultMaterial,
    angularDamping: 0.35,
    linearDamping: 0.15,
  });

  body.position.set(x, y, z);
  world.addBody(body);

  const diceGeom = new THREE.BoxGeometry(2, 2, 2);
  const diceMesh = new THREE.Mesh(diceGeom, diceMaterials);
  diceMesh.position.set(x, y, z);
  diceMesh.castShadow = true;
  diceMesh.receiveShadow = true;

  scene.add(diceMesh);

  return { dice: diceMesh, body };
};

export const rollDice = (body) => {
  // Wake up the body and reset velocities
  body.wakeUp();
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(0, 0, 0);

  // Random throw direction with natural variance
  const angle = Math.random() * Math.PI * 2;
  const speed = 16 + Math.random() * 10;

  // Random throw direction
  const dirX = Math.cos(angle);
  const dirZ = Math.sin(angle);

  // Good upward impulse for rolling with bounce
  const upwardForce = 11 + Math.random() * 7;

  // Apply impulse
  const impulse = new CANNON.Vec3(dirX * speed, upwardForce, dirZ * speed);

  body.applyImpulse(impulse, body.position);

  // Add fast, random spinning on all axes
  const spinX = (Math.random() - 0.5) * 80;
  const spinY = (Math.random() - 0.5) * 90;
  const spinZ = (Math.random() - 0.5) * 85;

  body.angularVelocity.set(spinX, spinY, spinZ);
};

export const getTopFace = (body) => {
  const up = new CANNON.Vec3(0, 1, 0);

  // Directions match face values: 1, 6, 2, 5, 3, 4
  const directions = [
    new CANNON.Vec3(1, 0, 0), // Face 1
    new CANNON.Vec3(-1, 0, 0), // Face 6
    new CANNON.Vec3(0, 1, 0), // Face 2
    new CANNON.Vec3(0, -1, 0), // Face 5
    new CANNON.Vec3(0, 0, 1), // Face 3
    new CANNON.Vec3(0, 0, -1), // Face 4
  ];

  let maxDot = -1;
  let topIndex = 0;

  for (let i = 0; i < directions.length; i++) {
    const worldDir = body.quaternion.vmult(directions[i]);
    const dot = worldDir.dot(up);

    if (dot > maxDot) {
      maxDot = dot;
      topIndex = i;
    }
  }

  return faceValues[topIndex];
}

export const checkDiceSum = ({dice1Face, dice2Face, gameState}) => {
  if (
    !gameState.selectedFace ||
    !gameState.betPlaced ||
    dice1Face === 0 ||
    dice2Face === 0
  )
    return false;

  const sum = dice1Face + dice2Face;

  // Check if the sum is in the selected pair
  if (gameState.selectedFace.includes(sum)) {
    // Find the multiplier for this pair
    const pair = bettingPairs.find(
      (p) =>
        p.sums.includes(sum) &&
        p.sums.every((s) => gameState.selectedFace.includes(s)),
    );
    if (pair) {
      // Multiplier is payout ratio: 1.25x means you get back £1.25 on a £1 bet
      // So profit = (multiplier - 1) × bet
      const winnings = gameState.betAmount * (pair.multiplier - 1);
      return winnings;
    }
  }
  return false;
}