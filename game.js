// Import Three.js modules
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Game variables
let scene, camera, renderer, world;
let hand, handModel;
let boxes = [];
let score = 0;
let gameStarted = false;

// Physics variables
const MARS_GRAVITY = -3.73;
let handVelocity = { x: 0, y: 0, z: 0 };
let isGrounded = false;
let windForce = { x: 0, z: 0 };

// Controls
let joystickData = { x: 0, y: 0 };
let isJumpPressed = false;

// Game constants
const HAND_SPEED = 5;
const JUMP_FORCE = 8;
const GROUND_Y = 0;
const HAND_HEIGHT = 0.18;

// Initialize the game
function init() {
    createScene();
    createEnvironment();
    loadHandModel();
    createBoxes();
    setupControls();
    setupWind();
    animate();
}

function createScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Create camera (third person behind the hand)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Create renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create directional light (sun behind the hand)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
}

function createEnvironment() {
    // Create ground with grass texture
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 }); // Grass green
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = GROUND_Y;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create mountains in the background
    for (let i = 0; i < 10; i++) {
        const mountainGeometry = new THREE.ConeGeometry(
            Math.random() * 3 + 1, // radius
            Math.random() * 8 + 5, // height
            8 // segments
        );
        const mountainMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(0.3, 0.3, Math.random() * 0.3 + 0.3) 
        });
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(
            (Math.random() - 0.5) * 100,
            mountainGeometry.parameters.height / 2,
            -Math.random() * 20 - 30
        );
        mountain.rotation.y = Math.random() * Math.PI * 2;
        scene.add(mountain);
    }

    // Add some clouds
    for (let i = 0; i < 15; i++) {
        const cloudGeometry = new THREE.SphereGeometry(Math.random() * 2 + 1, 16, 16);
        const cloudMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            (Math.random() - 0.5) * 80,
            Math.random() * 10 + 15,
            (Math.random() - 0.5) * 80
        );
        scene.add(cloud);
    }
}

function loadHandModel() {
    const loader = new GLTFLoader();
    loader.load('./assets/meshy-hand.glb', (gltf) => {
        handModel = gltf.scene;
        handModel.scale.set(1, 1, 1);
        handModel.position.set(0, GROUND_Y + HAND_HEIGHT / 2, 0);
        handModel.castShadow = true;
        handModel.receiveShadow = true;
        
        // Enable shadows for all meshes in the model
        handModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(handModel);
        hand = handModel;
        gameStarted = true;
    }, undefined, (error) => {
        console.error('Error loading hand model:', error);
        // Create a simple box as fallback
        const handGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.07);
        const handMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        hand = new THREE.Mesh(handGeometry, handMaterial);
        hand.position.set(0, GROUND_Y + HAND_HEIGHT / 2, 0);
        hand.castShadow = true;
        hand.receiveShadow = true;
        scene.add(hand);
        gameStarted = true;
    });
}

function createBoxes() {
    // Create floating boxes with random positions
    for (let i = 0; i < 15; i++) {
        const boxGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.04);
        const boxMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6) 
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        
        box.position.set(
            (Math.random() - 0.5) * 20,
            Math.random() * 3 + 1.5,
            (Math.random() - 0.5) * 20
        );
        
        box.castShadow = true;
        box.receiveShadow = true;
        
        // Add random point value (1-10)
        box.userData.points = Math.floor(Math.random() * 10) + 1;
        box.userData.collected = false;
        
        scene.add(box);
        boxes.push(box);
    }
}

function setupControls() {
    const joystick = document.getElementById('joystick');
    const joystickKnob = document.getElementById('joystickKnob');
    const jumpButton = document.getElementById('jumpButton');
    
    let isDragging = false;
    let joystickRect = joystick.getBoundingClientRect();
    
    // Update joystick rect on window resize
    window.addEventListener('resize', () => {
        joystickRect = joystick.getBoundingClientRect();
    });
    
    function updateJoystick(clientX, clientY) {
        const centerX = joystickRect.left + joystickRect.width / 2;
        const centerY = joystickRect.top + joystickRect.height / 2;
        
        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = joystickRect.width / 2 - 25;
        
        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }
        
        joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        
        // Update joystick data (normalize to -1 to 1)
        joystickData.x = deltaX / maxDistance;
        joystickData.y = -deltaY / maxDistance; // Invert Y axis
    }
    
    function resetJoystick() {
        joystickKnob.style.transform = 'translate(0px, 0px)';
        joystickData.x = 0;
        joystickData.y = 0;
    }
    
    // Touch events for joystick
    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        updateJoystick(touch.clientX, touch.clientY);
    });
    
    joystick.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDragging) {
            const touch = e.touches[0];
            updateJoystick(touch.clientX, touch.clientY);
        }
    });
    
    joystick.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDragging = false;
        resetJoystick();
    });
    
    // Mouse events for joystick (for desktop testing)
    joystick.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        updateJoystick(e.clientX, e.clientY);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateJoystick(e.clientX, e.clientY);
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            resetJoystick();
        }
    });
    
    // Jump button events
    jumpButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isJumpPressed = true;
    });
    
    jumpButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        isJumpPressed = false;
    });
    
    jumpButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isJumpPressed = true;
    });
    
    jumpButton.addEventListener('mouseup', (e) => {
        e.preventDefault();
        isJumpPressed = false;
    });
    
    // Keyboard controls for desktop testing
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                isJumpPressed = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                joystickData.y = 1;
                break;
            case 'ArrowDown':
            case 'KeyS':
                joystickData.y = -1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                joystickData.x = -1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                joystickData.x = 1;
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'Space':
                isJumpPressed = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'ArrowDown':
            case 'KeyS':
                joystickData.y = 0;
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'ArrowRight':
            case 'KeyD':
                joystickData.x = 0;
                break;
        }
    });
}

function setupWind() {
    // Update wind every 3-7 seconds
    setInterval(() => {
        windForce.x = (Math.random() - 0.5) * 200 / 3600; // Convert m/s to per frame (60fps)
        windForce.z = (Math.random() - 0.5) * 200 / 3600;
    }, Math.random() * 4000 + 3000);
}

function updatePhysics(deltaTime) {
    if (!hand || !gameStarted) return;
    
    const handPosition = hand.position;
    
    // Apply gravity
    handVelocity.y += MARS_GRAVITY * deltaTime;
    
    // Apply movement from joystick
    handVelocity.x = joystickData.x * HAND_SPEED;
    handVelocity.z = -joystickData.y * HAND_SPEED; // Invert for correct forward movement
    
    // Apply wind force
    handVelocity.x += windForce.x;
    handVelocity.z += windForce.z;
    
    // Handle jumping
    if (isJumpPressed && isGrounded) {
        handVelocity.y = JUMP_FORCE;
        isGrounded = false;
    }
    
    // Update position
    handPosition.x += handVelocity.x * deltaTime;
    handPosition.y += handVelocity.y * deltaTime;
    handPosition.z += handVelocity.z * deltaTime;
    
    // Ground collision
    if (handPosition.y <= GROUND_Y + HAND_HEIGHT / 2) {
        handPosition.y = GROUND_Y + HAND_HEIGHT / 2;
        handVelocity.y = 0;
        isGrounded = true;
    }
    
    // Keep hand within bounds
    handPosition.x = Math.max(-25, Math.min(25, handPosition.x));
    handPosition.z = Math.max(-25, Math.min(25, handPosition.z));
}

function checkCollisions() {
    if (!hand || !gameStarted) return;
    
    const handBox = new THREE.Box3().setFromObject(hand);
    
    boxes.forEach((box) => {
        if (box.userData.collected) return;
        
        const boxBox = new THREE.Box3().setFromObject(box);
        
        if (handBox.intersectsBox(boxBox)) {
            // Check if hand hit from below (like Mario)
            if (hand.position.y < box.position.y) {
                collectBox(box);
            }
        }
    });
}

function collectBox(box) {
    if (box.userData.collected) return;
    
    box.userData.collected = true;
    score += box.userData.points;
    
    // Change box color to gray
    box.material.color.setHex(0x808080);
    
    // Update score display
    document.getElementById('score').textContent = `Pontos: ${score}`;
    
    // Add some visual feedback
    const originalScale = box.scale.clone();
    box.scale.multiplyScalar(1.2);
    
    setTimeout(() => {
        box.scale.copy(originalScale);
    }, 200);
}

function updateCamera() {
    if (!hand) return;
    
    // Third person camera following the hand
    const idealOffset = new THREE.Vector3(0, 2, 5);
    const idealPosition = hand.position.clone().add(idealOffset);
    
    camera.position.lerp(idealPosition, 0.1);
    camera.lookAt(hand.position);
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = 0.016; // Assume 60fps for consistent physics
    
    updatePhysics(deltaTime);
    checkCollisions();
    updateCamera();
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

// Start the game when page loads
window.addEventListener('load', init);