import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import { useUpdateBalance } from "./hooks/balance";
import { useUpdateStake } from "./hooks/stake";
import { bettingPairs, faceValues, waysToRoll } from "./constants";
import { useBetPanel } from "./hooks/betPanel";
import { showResultModal } from "./common/modal";
import { checkDiceSum, createDice, getTopFace, rollDice } from "./worldObjects/dice";
import { createCasinoBucket } from "./worldObjects/casinoBucket";
import { createGround } from "./worldObjects/ground";


const gameState = {
  betPlaced: false,
  betAmount: 0,
  selectedFace: null,
  diceRolling: false,
  resultsChecked: false,
  settleTime: 0,
};

window.addEventListener("DOMContentLoaded", () => {
  useUpdateStake();
  useBetPanel({
    rollDice,
    gameState,
    diceBody,
    diceBody2,
  });
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(8, 35, 0);

const canvas = document.querySelector(".webgl");

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const parent = document.querySelector(".game-canvas");

function resizeRenderer() {
  requestAnimationFrame(() => {
    const rect = parent.getBoundingClientRect();

    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    // force visual size to parent
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.maxWidth = "100%";
    canvas.style.maxHeight = "100%";

    // then update Three.js internal resolution
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    console.log("Parent visual:", parent.getBoundingClientRect().height);
    console.log("Canvas visual:", canvas.getBoundingClientRect().height);
    console.log("Canvas internal:", canvas.height);
  });
}

new ResizeObserver(resizeRenderer).observe(parent);
resizeRenderer();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ------------------------------------------------ */
/* PHYSICS WORLD */
/* ------------------------------------------------ */

const world = new CANNON.World();

world.gravity.set(0, -9.82, 0);
world.allowSleep = true;

const defaultMaterial = new CANNON.Material("default");
const wallMaterial = new CANNON.Material("wall");

const contactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.2,
    restitution: 0.75,
  },
);
const contactWallMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  wallMaterial,
  {
    friction: 0,
    restitution: 0.5,
  },
);
world.defaultContactMaterial = contactMaterial;
world.addContactMaterial(contactMaterial);
world.addContactMaterial(contactWallMaterial);
/* ------------------------------------------------ */
/* LIGHTING */
/* ------------------------------------------------ */

const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfff8e7, 1.5);
directionalLight.position.set(2, 10, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
directionalLight.shadow.camera.far = 40;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xff9944, 0.8);
pointLight.position.set(0, 8, 0);
scene.add(pointLight);

createCasinoBucket({radius:6, height:10, segments:64, scene, world, defaultMaterial, wallMaterial});
const { dice: diceMesh, body: diceBody } = createDice({
  x: -2,
  y: 1.5,
  z: 1,
  world,
  scene,
  defaultMaterial
});
const { dice: diceMesh2, body: diceBody2 } = createDice({
  x: 2,
  y: 1.5,
  z: -1,
  world,
  scene,
  defaultMaterial
});

createGround(scene);
/* ------------------------------------------------ */
/* ANIMATE */
/* ------------------------------------------------ */
const clock = new THREE.Clock();
let oldElapsed = 0;

let dice1RolledAfterSleep = false;
let dice2RolledAfterSleep = false;

let dice1Face = 0;
let dice2Face = 0;


function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const delta = elapsed - oldElapsed;
  oldElapsed = elapsed;

  world.step(1 / 60, delta, 3);

  diceMesh.position.copy(diceBody.position);
  diceMesh.quaternion.copy(diceBody.quaternion);
  diceMesh2.position.copy(diceBody2.position);
  diceMesh2.quaternion.copy(diceBody2.quaternion);

  // Check if both dice are completely still (not moving)
  const dice1Velocity = diceBody.velocity.length();
  const dice2Velocity = diceBody2.velocity.length();
  const dice1AngularVelocity = diceBody.angularVelocity.length();
  const dice2AngularVelocity = diceBody2.angularVelocity.length();

  const dice1IsStill = dice1Velocity < 0.01 && dice1AngularVelocity < 0.01;
  const dice2IsStill = dice2Velocity < 0.01 && dice2AngularVelocity < 0.01;

  // Mark dice as rolled when they start sleeping
  if (diceBody.sleepState === CANNON.Body.SLEEPING && !dice1RolledAfterSleep) {
    dice1RolledAfterSleep = true;
  }

  if (diceBody2.sleepState === CANNON.Body.SLEEPING && !dice2RolledAfterSleep) {
    dice2RolledAfterSleep = true;
  }

  // When both dice are completely still, check their sum
  if (
    dice1RolledAfterSleep &&
    dice2RolledAfterSleep &&
    dice1IsStill &&
    dice2IsStill &&
    !gameState.resultsChecked &&
    gameState.diceRolling
  ) {
    if (gameState.settleTime === 0) {
      gameState.settleTime = elapsed;
      // Check face values now that dice are completely still
      dice1Face = getTopFace(diceBody);
      dice2Face = getTopFace(diceBody2);
    }

    // Wait 1.5 seconds for natural settling time
    if (elapsed - gameState.settleTime >= 1.5) {
      gameState.resultsChecked = true;
      const { balanceElement, currentBalance } = useUpdateBalance();

      // Check if sum matches selected sum
      const winnings = checkDiceSum({dice1Face, dice2Face, gameState});
      if (winnings) {
        const newBalance = currentBalance + gameState.betAmount + winnings;
        showResultModal({ type: "win", winnings });
        balanceElement.textContent = "Balance: " + newBalance.toFixed(2);
      } else {
        const betPair = bettingPairs.find((p) =>
          p.sums.every((s) => gameState.selectedFace.includes(s)),
        );
        const betName = betPair ? betPair.name : "unknown";
        showResultModal({
          type: "lose",
          betName,
          rolledSum: dice1Face + dice2Face,
        });
      }

      // Reset for next round
      gameState.betAmount = 0;
      gameState.betPlaced = false;
      gameState.diceRolling = false;
      dice1RolledAfterSleep = false;
      dice2RolledAfterSleep = false;
      dice1Face = 0;
      dice2Face = 0;
      gameState.settleTime = 0;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
