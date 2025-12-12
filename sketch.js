let camX = 0;
let camZ = 0;
let camAngle = 0;
let targetCamX = 0;
let targetCamZ = 0;
let targetCamAngle = 0;
let cloudImg;
let soundtrack;
let soundStarted = false;
let showStartScreen = true;
let showIntroScreen = false;
let showEndScreen = false;
let audioFadeIn = 0; // For smooth audio fade-in
let audioFadeOut = 0; // For smooth audio fade-out
let experienceDuration = 480; // 8 minutes in seconds
let experienceStartTime = 0; // When the experience started
let objectProximity = {}; // Track how long player has been near each object
let returningToCenter = false;
let returnProgress = 0;
let worldAge = 0; // How long the world has existed (in frames)
let colorShift = 0; // Slowly shifting color palette
let bgR, bgG, bgB; // Background colors accessible throughout draw
let motionAmount = 0; // Track player motion for datamosh effect
let prevCamX = 0;
let prevCamZ = 0;
let prevCamAngle = 0;
let baseInstability = 0; // Global life cycle instability

function preload() {
  cloudImg = loadImage('Assets/Backdrops/cloudy.gif');
  soundtrack = loadSound('Assets/Psychoacoustics (soundtrack) .mp3');
}

function setup() {
  createCanvas(800, 800, WEBGL);
  imageMode(CENTER);
  
  // Enable lighting
  lights();
}

function draw() {
  // Skip rendering only if start screen is showing
  if (showStartScreen) {
    return;
  }
  
  // Check if experience should end (8 minutes)
  let elapsedTime = (millis() - experienceStartTime) / 1000; // seconds
  let timeRemaining = experienceDuration - elapsedTime;
  
  // Start fade out 10 seconds before end
  if (timeRemaining < 10 && timeRemaining > 0) {
    audioFadeOut = map(timeRemaining, 10, 0, 0, 1);
    soundtrack.setVolume((1 - audioFadeOut) * 0.75);
  }
  
  // End experience and show end screen
  if (elapsedTime >= experienceDuration && !showEndScreen) {
    showEndScreen = true;
    soundtrack.stop();
    document.getElementById('endScreen').classList.remove('hidden');
    return;
  }
  
  // Skip rendering if end screen is showing
  if (showEndScreen) {
    return;
  }
  
  // Fade in audio smoothly at start
  if (soundStarted && audioFadeIn < 1 && elapsedTime < 2) {
    audioFadeIn += 0.01; // Fade in over ~100 frames
    soundtrack.setVolume(audioFadeIn * 0.75);
  }
  
  // Calculate motion amount for datamosh effect
  let deltaX = abs(camX - prevCamX);
  let deltaZ = abs(camZ - prevCamZ);
  let deltaAngle = abs(camAngle - prevCamAngle);
  
  // Movement has less blur, rotation has moderate blur
  let positionMotion = (deltaX + deltaZ) * 0.3; // Reduced weight for forward/back movement
  let rotationMotion = deltaAngle * 40; // Moderate weight for turning
  let currentMotion = positionMotion + rotationMotion;
  
  // Smooth motion tracking with decay
  motionAmount = lerp(motionAmount, currentMotion, 0.3);
  motionAmount *= 0.85; // Decay over time
  
  // Update previous position
  prevCamX = camX;
  prevCamZ = camZ;
  prevCamAngle = camAngle;
  
  // Calculate distance from origin for edge instability (use for both effects)
  let distFromOrigin = sqrt(camX * camX + camZ * camZ);
  let edgeIntensity = constrain(map(distFromOrigin, 600, 1200, 0, 1), 0, 1);
  
  // PROGRESSIVE SOLIDIFICATION: Calculate life cycle phase (0 to 1 over 8 minutes)
  let experienceProgress = constrain(elapsedTime / experienceDuration, 0, 1);
  
  // Three phases: Birth (0-0.2), Stability (0.2-0.7), Dissolution (0.7-1.0)
  let stabilityAmount;
  if (experienceProgress < 0.2) {
    // Birth phase: very unstable → stabilizing
    stabilityAmount = map(experienceProgress, 0, 0.2, 0, 1);
  } else if (experienceProgress < 0.7) {
    // Stable phase: fully materialized
    stabilityAmount = 1;
  } else {
    // Dissolution phase: stable → dissolving back to void
    stabilityAmount = map(experienceProgress, 0.7, 1, 1, 0);
  }
  
  // Invert stability to get instability (0 = stable, 1 = chaotic)
  baseInstability = 1 - stabilityAmount; // Update global variable
  
  // Apply datamosh effect to canvas based on motion, edge, AND life cycle
  let canvas = document.querySelector('canvas');
  let datamoshIntensity = constrain(map(motionAmount, 0, 5, 0, 1), 0, 1);
  
  // Combine motion, edge, and base instability effects
  let totalIntensity = datamoshIntensity + (edgeIntensity * 0.8) + (baseInstability * 1.2);
  totalIntensity = constrain(totalIntensity, 0, 2);
  
  // More motion/distance/instability = more datamosh
  let blurAmount = totalIntensity * 5;
  let contrastAmount = 1 + (totalIntensity * 0.8);
  let saturateAmount = 1 - (totalIntensity * 0.5);
  let brightnessAmount = 1 + (totalIntensity * 0.3);
  
  // Add glitch effects at edges and during unstable phases
  let hueRotate = (edgeIntensity + baseInstability) * 30 * sin(frameCount * 0.1); // Color shifting glitch
  let grayscale = (edgeIntensity + baseInstability * 0.5) * 0.3; // Partial desaturation
  
  canvas.style.filter = `
    blur(${blurAmount}px) 
    contrast(${contrastAmount}) 
    saturate(${saturateAmount})
    brightness(${brightnessAmount})
    hue-rotate(${hueRotate}deg)
    grayscale(${grayscale})
  `;
  
  // Temporal progression - world evolves over time
  worldAge += 1;
  colorShift = sin(worldAge * 0.0005) * 30; // Slowly oscillate between -30 and +30
  
  // Background shifts through different color zones over time
  // Cycle through: dark blue -> dark green -> dark red -> dark yellow/orange
  let colorPhase = (worldAge * 0.0003) % (PI * 2); // Full cycle every ~20,000 frames
  
  if (colorPhase < PI / 2) {
    // Dark blue to dark green
    let t = colorPhase / (PI / 2);
    bgR = lerp(25, 20, t);
    bgG = lerp(35, 50, t);
    bgB = lerp(55, 40, t);
  } else if (colorPhase < PI) {
    // Dark green to dark red
    let t = (colorPhase - PI / 2) / (PI / 2);
    bgR = lerp(20, 55, t);
    bgG = lerp(50, 25, t);
    bgB = lerp(40, 25, t);
  } else if (colorPhase < PI * 1.5) {
    // Dark red to dark orange/yellow
    let t = (colorPhase - PI) / (PI / 2);
    bgR = lerp(55, 60, t);
    bgG = lerp(25, 45, t);
    bgB = lerp(25, 20, t);
  } else {
    // Dark orange back to dark blue
    let t = (colorPhase - PI * 1.5) / (PI / 2);
    bgR = lerp(60, 25, t);
    bgG = lerp(45, 35, t);
    bgB = lerp(20, 55, t);
  }
  
  background(bgR, bgG, bgB);
  
  // Handle return to center
  if (returningToCenter) {
    returnProgress += 0.05;
    if (returnProgress >= 1) {
      // Arrived at center
      camX = 0;
      camZ = 0;
      camAngle = 0;
      returningToCenter = false;
      returnProgress = 0;
    } else {
      // Smoothly interpolate to center
      let startX = camX;
      let startZ = camZ;
      camX = lerp(camX, 0, 0.1);
      camZ = lerp(camZ, 0, 0.1);
      camAngle = lerp(camAngle, 0, 0.1);
    }
  }
  
  // Camera movement controls with collision (only when not returning)
  if (!returningToCenter) {
    let moveSpeed = 2; // Movement influence on target
  
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) { // W or UP
      targetCamX += sin(targetCamAngle) * moveSpeed;
      targetCamZ += cos(targetCamAngle) * moveSpeed;
    }
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { // S or DOWN
      targetCamX -= sin(targetCamAngle) * moveSpeed;
      targetCamZ -= cos(targetCamAngle) * moveSpeed;
    }
  
    // Check collision before updating target
    if (checkCollision(targetCamX, targetCamZ)) {
      // Revert target if collision detected
      targetCamX = camX;
      targetCamZ = camZ;
    }
  
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { // A or LEFT
      targetCamAngle += 0.05;
    }
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { // D or RIGHT
      targetCamAngle -= 0.05;
    }
  }
  
  // Smooth interpolation towards target (momentum/easing)
  let smoothFactor = 0.15; // Lower = smoother but slower response
  camX = lerp(camX, targetCamX, smoothFactor);
  camZ = lerp(camZ, targetCamZ, smoothFactor);
  camAngle = lerp(camAngle, targetCamAngle, smoothFactor);
  
  // Calculate camera look-at point based on angle
  let lookX = camX + sin(camAngle) * 100;
  let lookZ = camZ + cos(camAngle) * 100;
  
  // Calculate distance from origin for reality instability (reuse distFromOrigin)
  let stabilityRadius = 800;
  let instability = constrain(map(distFromOrigin, stabilityRadius, stabilityRadius * 1.5, 0, 1), 0, 1);
  
  // Add camera sway - increases with instability
  let baseSway = sin(frameCount * 0.01) * 2;
  let shakeSway = sin(frameCount * 0.15) * cos(frameCount * 0.12) * 8 * instability;
  let totalSway = baseSway + shakeSway;
  
  // Add horizontal shake when unstable
  let shakeX = sin(frameCount * 0.2) * 5 * instability;
  let shakeZ = cos(frameCount * 0.18) * 5 * instability;
  
  // Set up camera view - at ground level looking forward
  camera(camX + shakeX, -50 + totalSway, camZ + shakeZ, lookX, -50, lookZ, 0, 1, 0);
  
  // Set up dim lighting for the forming world - reduce quality at edges
  // Lighting slowly shifts color over time
  let lightIntensity = lerp(1, 0.3, instability);
  ambientLight((60 + colorShift) * lightIntensity, (80 + colorShift * 0.5) * lightIntensity, (100 - colorShift * 0.5) * lightIntensity);
  directionalLight((150 + colorShift) * lightIntensity, (170 + colorShift * 0.3) * lightIntensity, (200 - colorShift * 0.3) * lightIntensity, 0.5, 1, -0.5);
  
  // No sky or clouds - only void beyond consciousness
  
  // Draw checkered floor - only tiles near camera for performance
  let tileSize = 50;
  let renderDistance = 25; // How many tiles to render in each direction
  let consciousnessRadius = 600; // Larger radius so edges are more visible
  
  rotateX(HALF_PI); // Rotate the entire grid to be horizontal
  
  // Calculate which tiles to draw based on camera position
  let centerX = floor(camX / tileSize);
  let centerZ = floor(camZ / tileSize);
  
  for (let x = centerX - renderDistance; x < centerX + renderDistance; x++) {
    for (let z = centerZ - renderDistance; z < centerZ + renderDistance; z++) {
      push();
      
      // Calculate distance from origin (0,0) for reality stability
      let distFromOrigin = sqrt((x * tileSize) * (x * tileSize) + (z * tileSize) * (z * tileSize));
      let stabilityRadius = 800; // Reality is stable within this radius from center
      let instability = constrain(map(distFromOrigin, stabilityRadius, stabilityRadius * 1.5, 0, 1), 0, 1);
      
      // Check if we're in the last two minutes
      let lastMinuteFactor = 0;
      if (elapsedTime >= experienceDuration - 120) { // Last 120 seconds (2 minutes)
        lastMinuteFactor = map(elapsedTime, experienceDuration - 120, experienceDuration, 0, 1);
      }
      
      // Add wave/distortion that increases with distance from center AND in last minute
      // Wave patterns evolve over time
      let waveEvolution = worldAge * 0.00002;
      let baseWave = sin(frameCount * 0.02 + x * 0.3 + waveEvolution) * cos(frameCount * 0.015 + z * 0.3 - waveEvolution) * 3;
      let distortedWave = sin(frameCount * 0.05 + x * 0.5 + waveEvolution * 2) * cos(frameCount * 0.04 + z * 0.5 - waveEvolution) * 15;
      let combinedInstability = max(instability, lastMinuteFactor * 0.8); // Last minute adds global instability
      let waveOffset = lerp(baseWave, distortedWave, combinedInstability);
      
      // Bit reduction: snap position to grid at edges AND in last minute - much more extreme
      let gridSize = lerp(1, 80, pow(combinedInstability, 1.5)); // Exponential for dramatic effect
      let snappedX = floor((x * tileSize) / gridSize) * gridSize;
      let snappedZ = floor((z * tileSize) / gridSize) * gridSize;
      let snappedWave = floor(waveOffset / gridSize) * gridSize;
      
      translate(snappedX, snappedZ, snappedWave);
      
      // Calculate distance from camera for fade effect
      let dx = (x * tileSize) - camX;
      let dz = (z * tileSize) - camZ;
      let distFromCam = sqrt(dx * dx + dz * dz);
      
      // Progressive fade - tiles materialize as you approach
      // Start fading later so edges remain visible
      let fadeStart = consciousnessRadius * 0.75;
      let fadeAmount = constrain(map(distFromCam, fadeStart, consciousnessRadius, 0, 1), 0, 1);
      
      // Void color shifts with world age
      let voidColor = color(bgR, bgG, bgB);
      
      // Alternate between black and white - but glitch at edges AND in last minute
      // Tiles slowly gain color tint over time
      let tileColor;
      let shouldFlip = (x + z) % 2 === 0;
      
      // RGB color glitch effect - more intense at edges AND during last minute
      if (combinedInstability > 0.3 && random() < combinedInstability * 0.5) {
        // RGB color corruption
        if (random() < 0.3) {
          // Pure primary/secondary colors
          let colorVal = floor(random(0, 2)) * 255;
          let r = (floor(random(2))) * colorVal;
          let g = (floor(random(2))) * colorVal;
          let b = (floor(random(2))) * colorVal;
          tileColor = color(r, g, b);
        } else {
          // Glitchy grayscale with bit reduction
          let grayVal = random(255);
          let colorSteps = lerp(256, 2, pow(combinedInstability, 0.8));
          grayVal = floor(grayVal / colorSteps) * colorSteps;
          tileColor = color(grayVal);
        }
      } else {
        // Base tiles with subtle tint, plus noise in last minute
        let baseTint = abs(colorShift) * 0.3;
        let noiseAmount = lastMinuteFactor * 40; // Add RGB noise in last minute
        
        if (shouldFlip) {
          tileColor = color(
            255 - random(noiseAmount), 
            255 - baseTint - random(noiseAmount), 
            255 - baseTint * 1.5 - random(noiseAmount)
          );
        } else {
          tileColor = color(
            baseTint + random(noiseAmount), 
            baseTint * 0.5 + random(noiseAmount), 
            baseTint * 1.2 + random(noiseAmount)
          );
        }
      }
      
      // Blend tile color with void as it fades out
      let finalColor = lerpColor(tileColor, voidColor, fadeAmount);
      fill(finalColor);
      
      noStroke();
      plane(tileSize, tileSize);
      pop();
    }
  }
  
  // Draw 3D objects
  drawObjects();
  
  // Draw floating fragments
  drawFloatingFragments();
}

function drawObjects() {
  // Array of object positions and properties - scattered throughout the world
  let objects = [
    {x: 200, z: -300, type: 'box', size: 80, height: 120, color: [100, 100, 200]},
    {x: -250, z: -400, type: 'box', size: 60, height: 100, color: [50, 50, 50]},
    {x: 350, z: 150, type: 'sphere', size: 70, color: [255, 100, 150]},
    {x: -150, z: 250, type: 'box', size: 90, height: 80, color: [150, 150, 150]},
    {x: 450, z: -200, type: 'cylinder', size: 50, height: 130, color: [200, 100, 100]},
    {x: -350, z: 100, type: 'box', size: 100, height: 90, color: [80, 80, 120]},
    {x: 100, z: -600, type: 'sphere', size: 60, color: [255, 200, 100]},
    {x: -500, z: -150, type: 'box', size: 70, height: 150, color: [40, 40, 40]},
    
    // More objects in different directions
    {x: 600, z: 300, type: 'sphere', size: 65, color: [180, 100, 200]},
    {x: -600, z: 400, type: 'box', size: 75, height: 110, color: [100, 150, 180]},
    {x: 300, z: -800, type: 'cylinder', size: 45, height: 140, color: [150, 180, 100]},
    {x: -400, z: -700, type: 'box', size: 85, height: 95, color: [200, 150, 100]},
    {x: 800, z: -100, type: 'sphere', size: 75, color: [100, 200, 180]},
    {x: -200, z: 600, type: 'box', size: 65, height: 120, color: [220, 180, 140]},
    {x: 150, z: 800, type: 'cylinder', size: 55, height: 125, color: [140, 120, 180]},
    {x: -700, z: -300, type: 'box', size: 90, height: 85, color: [60, 80, 100]},
    
    // Even further out
    {x: 900, z: 500, type: 'sphere', size: 70, color: [200, 120, 160]},
    {x: -800, z: 700, type: 'cylinder', size: 60, height: 135, color: [120, 180, 160]},
    {x: 500, z: -1000, type: 'box', size: 80, height: 100, color: [180, 100, 140]},
    {x: -900, z: -500, type: 'box', size: 70, height: 130, color: [100, 120, 160]},
    {x: 1000, z: 200, type: 'cylinder', size: 50, height: 120, color: [160, 140, 100]},
    {x: -300, z: 1000, type: 'sphere', size: 65, color: [140, 160, 200]},
    {x: 700, z: -600, type: 'box', size: 75, height: 115, color: [120, 100, 80]},
    {x: -600, z: 800, type: 'cylinder', size: 55, height: 145, color: [180, 140, 120]},
  ];
  
  // Undo the floor rotation first
  rotateX(-HALF_PI);
  
  for (let obj of objects) {
    push();
    
    // Calculate proper Y position based on object type and size
    let yPos;
    if (obj.type === 'box' || obj.type === 'cylinder') {
      yPos = -obj.height / 2; // Half height so bottom sits on floor
    } else if (obj.type === 'sphere') {
      yPos = -obj.size; // Sphere radius so bottom sits on floor
    }
    
    // Add subtle floating motion - objects gently rise and fall
    let floatOffset = sin(frameCount * 0.01 + obj.x * 0.01) * 5;
    yPos += floatOffset;
    
    // Slight rotation drift for surreal feel
    let driftRotation = sin(frameCount * 0.005 + obj.z * 0.01) * 0.05;
    
    // Position in world space (not relative to camera)
    translate(obj.x, yPos, obj.z);
    rotateY(driftRotation);
    
    // Calculate distance and materialization
    let dx = obj.x - camX;
    let dz = obj.z - camZ;
    let distFromCam = sqrt(dx * dx + dz * dz);
    
    // Track proximity over time for gradual materialization
    let objKey = obj.x + '_' + obj.z;
    if (!objectProximity[objKey]) {
      objectProximity[objKey] = 0;
    }
    
    // Increase materialization when close, decrease when far
    if (distFromCam < 600) {
      objectProximity[objKey] = min(objectProximity[objKey] + 0.02, 1);
    } else {
      objectProximity[objKey] = max(objectProximity[objKey] - 0.01, 0);
    }
    
    let materialAmount = objectProximity[objKey];
    
    // Calculate fog for objects - fade to void with larger radius
    let consciousnessRadius = 600;
    let fadeAmount = constrain(map(distFromCam, consciousnessRadius * 0.75, consciousnessRadius, 0, 1), 0, 1);
    
    // Apply color fading to void - void color shifts over time
    let voidColor = color(bgR, bgG, bgB);
    
    // Object colors evolve over time
    let timeShift = sin(worldAge * 0.0003 + obj.x * 0.01) * 40;
    let objColor = color(
      constrain(obj.color[0] + timeShift, 0, 255), 
      constrain(obj.color[1] + timeShift * 0.5, 0, 255), 
      constrain(obj.color[2] - timeShift * 0.3, 0, 255)
    );
    let finalColor = lerpColor(objColor, voidColor, fadeAmount);
    
    // Shape morphing - slowly transition between shapes
    let morphProgress = (sin(frameCount * 0.005 + obj.x * 0.001) + 1) / 2; // 0 to 1
    
    // Calculate instability for this object based on distance from origin AND life cycle
    let objDistFromOrigin = sqrt(obj.x * obj.x + obj.z * obj.z);
    let objInstability = constrain(map(objDistFromOrigin, 800, 1200, 0, 1), 0, 1);
    
    // Add base instability from life cycle phase
    objInstability = constrain(objInstability + baseInstability * 0.7, 0, 1);
    
    // BITMAP PIXELATION: Calculate proximity-based pixelation
    // Closer = more pixelated (inverted LOD)
    let pixelationDistance = 250; // Start pixelating within this range
    let proximityPixelation = 0;
    
    if (distFromCam < pixelationDistance) {
      // Very close = extreme pixelation
      proximityPixelation = map(distFromCam, pixelationDistance, 5, 0, 1);
      proximityPixelation = constrain(proximityPixelation, 0, 1);
      proximityPixelation = pow(proximityPixelation, 0.4); // Faster falloff
    }
    
    // Combine proximity pixelation with edge instability
    let totalPixelation = max(objInstability, proximityPixelation);
    
    // COLOR BIT-CRUSHING: Reduce color depth based on pixelation
    // Full color (256 levels per channel) -> harsh banding (4-16 levels per channel)
    let colorSteps = floor(lerp(256, 6, pow(totalPixelation, 0.5)));
    let r = floor(red(finalColor) / colorSteps) * colorSteps;
    let g = floor(green(finalColor) / colorSteps) * colorSteps;
    let b = floor(blue(finalColor) / colorSteps) * colorSteps;
    let crushedColor = color(r, g, b);
    
    // Apply transparency based on materialization and distance
    let distanceAlpha = map(distFromCam, 0, consciousnessRadius, 255, 0);
    let materialAlpha = lerp(50, 255, materialAmount);
    let alpha = min(distanceAlpha, materialAlpha);
    fill(red(crushedColor), green(crushedColor), blue(crushedColor), alpha);
    noStroke();
    
    // EXTREME polygon reduction - proximity makes it worse
    // At max pixelation: spheres become tetrahedrons (4 faces), super chunky!
    let detailLevel = floor(lerp(32, 4, pow(totalPixelation, 0.3)));
    detailLevel = max(4, detailLevel); // Minimum 4 for extreme chunkiness
    
    // Draw shapes with morphing and reduced detail
    if (obj.type === 'box') {
      // Morph between box and slightly rounded/distorted box
      push();
      let scaleX = (1 + sin(frameCount * 0.008 + obj.x) * 0.1);
      let scaleY = (1 + cos(frameCount * 0.006 + obj.z) * 0.1);
      let scaleZ = (1 + sin(frameCount * 0.007 + obj.x) * 0.1);
      scale(scaleX, scaleY, scaleZ);
      box(obj.size, obj.height, obj.size, detailLevel, detailLevel);
      pop();
    } else if (obj.type === 'sphere') {
      // Morph sphere size slightly - reduce detail
      let morphSize = obj.size * (1 + sin(frameCount * 0.008 + obj.x) * 0.15);
      sphere(morphSize, detailLevel, detailLevel);
    } else if (obj.type === 'cylinder') {
      // Morph cylinder proportions - reduce detail
      push();
      let scaleX = (1 + sin(frameCount * 0.007 + obj.x) * 0.12);
      let scaleY = (1 + cos(frameCount * 0.009 + obj.z) * 0.08);
      let scaleZ = (1 + sin(frameCount * 0.006 + obj.x) * 0.12);
      scale(scaleX, scaleY, scaleZ);
      cylinder(obj.size, obj.height, detailLevel, 1);
      pop();
    }
    
    // Draw orbiting fragments around object
    drawOrbitingFragments(obj, distFromCam, consciousnessRadius, materialAmount);
    
    pop();
  }
}

function drawOrbitingFragments(obj, distFromCam, consciousnessRadius, materialAmount) {
  // Only show orbiting fragments when object is materialized enough
  // But during birth/dissolution phases, they appear earlier/persist longer
  let fragmentThreshold = lerp(0.3, 0.1, baseInstability);
  if (materialAmount < fragmentThreshold) return;
  
  // Number of orbiting pieces increases during unstable phases
  let numFragments = floor(lerp(3, 8, baseInstability));
  let orbitRadius = obj.size * 1.5;
  
  for (let i = 0; i < numFragments; i++) {
    push();
    
    // Calculate orbit position
    let angle = (frameCount * 0.02) + (i * TWO_PI / numFragments) + obj.x * 0.01;
    let orbitX = cos(angle) * orbitRadius;
    let orbitZ = sin(angle) * orbitRadius;
    let orbitY = sin(frameCount * 0.03 + i) * 20; // Vertical wobble
    
    translate(orbitX, orbitY, orbitZ);
    
    // Rotate the fragment
    rotateY(frameCount * 0.05 + i);
    rotateX(frameCount * 0.03 + i);
    
    // Color and transparency matching parent object
    let voidColor = color(10, 15, 30);
    let fragColor = color(obj.color[0], obj.color[1], obj.color[2]);
    let fadeAmount = constrain(map(distFromCam, consciousnessRadius * 0.6, consciousnessRadius, 0, 1), 0, 1);
    let finalColor = lerpColor(fragColor, voidColor, fadeAmount);
    
    let distanceAlpha = map(distFromCam, 0, consciousnessRadius, 180, 0);
    let materialAlpha = lerp(30, 180, materialAmount);
    let alpha = min(distanceAlpha, materialAlpha);
    
    fill(red(finalColor), green(finalColor), blue(finalColor), alpha);
    noStroke();
    
    // Small geometric shapes
    let fragmentSize = obj.size * 0.2;
    if (i % 3 === 0) {
      box(fragmentSize);
    } else if (i % 3 === 1) {
      sphere(fragmentSize * 0.6);
    } else {
      // Triangle-ish using plane
      plane(fragmentSize, fragmentSize);
    }
    
    pop();
  }
}

function drawFloatingFragments() {
  // Undo the floor rotation
  rotateX(-HALF_PI);
  
  // Array of floating fragments
  let fragments = [
    {x: 150, z: -200, startY: -150, type: 'triangle', size: 30, speed: 0.008, rotSpeed: 0.01, color: [200, 150, 100]},
    {x: -180, z: -350, startY: -100, type: 'square', size: 25, speed: 0.006, rotSpeed: 0.015, color: [100, 150, 200]},
    {x: 250, z: 100, startY: -180, type: 'triangle', size: 35, speed: 0.01, rotSpeed: 0.008, color: [150, 100, 150]},
    {x: -300, z: -100, startY: -120, type: 'square', size: 28, speed: 0.007, rotSpeed: 0.012, color: [180, 180, 120]},
    {x: 100, z: -450, startY: -200, type: 'triangle', size: 22, speed: 0.009, rotSpeed: 0.02, color: [120, 180, 180]},
    {x: -100, z: 200, startY: -140, type: 'square', size: 32, speed: 0.005, rotSpeed: 0.01, color: [200, 120, 150]},
    {x: 400, z: -50, startY: -160, type: 'triangle', size: 27, speed: 0.011, rotSpeed: 0.018, color: [150, 150, 200]},
    {x: -250, z: 150, startY: -110, type: 'square', size: 24, speed: 0.008, rotSpeed: 0.014, color: [180, 140, 100]},
  ];
  
  for (let frag of fragments) {
    // Calculate distance first to check if fragment should exist
    let dx = frag.x - camX;
    let dz = frag.z - camZ;
    let distFromCam = sqrt(dx * dx + dz * dz);
    
    let consciousnessRadius = 400;
    
    // Skip fragments beyond consciousness - they don't exist yet
    if (distFromCam > consciousnessRadius) continue;
    
    push();
    
    // Calculate floating motion
    let floatOffset = sin(frameCount * frag.speed + frag.x * 0.01) * 50;
    let yPos = frag.startY + floatOffset;
    
    // Position in world
    translate(frag.x, yPos, frag.z);
    
    // Multi-axis rotation for organic drift
    rotateY(frameCount * frag.rotSpeed);
    rotateX(frameCount * frag.rotSpeed * 0.7);
    rotateZ(frameCount * frag.rotSpeed * 0.5);
    
    // Calculate fade to void
    let fadeAmount = constrain(map(distFromCam, consciousnessRadius * 0.6, consciousnessRadius, 0, 1), 0, 1);
    let voidColor = color(10, 15, 30);
    let fragColor = color(frag.color[0], frag.color[1], frag.color[2]);
    let finalColor = lerpColor(fragColor, voidColor, fadeAmount);
    
    // Semi-transparent, fading out at distance
    let distanceAlpha = map(distFromCam, 0, consciousnessRadius, 180, 0);
    fill(red(finalColor), green(finalColor), blue(finalColor), distanceAlpha);
    noStroke();
    
    // Draw fragment shape
    if (frag.type === 'triangle') {
      // Draw triangle using plane rotated
      beginShape();
      vertex(0, -frag.size, 0);
      vertex(-frag.size * 0.866, frag.size * 0.5, 0);
      vertex(frag.size * 0.866, frag.size * 0.5, 0);
      endShape(CLOSE);
    } else if (frag.type === 'square') {
      plane(frag.size, frag.size);
    }
    
    pop();
  }
}

function checkCollision(x, z) {
  // Object positions from drawObjects - must match!
  let objects = [
    {x: 200, z: -300, type: 'box', size: 80},
    {x: -250, z: -400, type: 'box', size: 60},
    {x: 350, z: 150, type: 'sphere', size: 70},
    {x: -150, z: 250, type: 'box', size: 90},
    {x: 450, z: -200, type: 'cylinder', size: 50},
    {x: -350, z: 100, type: 'box', size: 100},
    {x: 100, z: -600, type: 'sphere', size: 60},
    {x: -500, z: -150, type: 'box', size: 70},
    {x: 600, z: 300, type: 'sphere', size: 65},
    {x: -600, z: 400, type: 'box', size: 75},
    {x: 300, z: -800, type: 'cylinder', size: 45},
    {x: -400, z: -700, type: 'box', size: 85},
    {x: 800, z: -100, type: 'sphere', size: 75},
    {x: -200, z: 600, type: 'box', size: 65},
    {x: 150, z: 800, type: 'cylinder', size: 55},
    {x: -700, z: -300, type: 'box', size: 90},
    {x: 900, z: 500, type: 'sphere', size: 70},
    {x: -800, z: 700, type: 'cylinder', size: 60},
    {x: 500, z: -1000, type: 'box', size: 80},
    {x: -900, z: -500, type: 'box', size: 70},
    {x: 1000, z: 200, type: 'cylinder', size: 50},
    {x: -300, z: 1000, type: 'sphere', size: 65},
    {x: 700, z: -600, type: 'box', size: 75},
    {x: -600, z: 800, type: 'cylinder', size: 55},
  ];
  
  let playerRadius = 30; // Collision radius for the player
  
  for (let obj of objects) {
    let dx = x - obj.x;
    let dz = z - obj.z;
    let distance = sqrt(dx * dx + dz * dz);
    
    // Check if too close to object
    let collisionDist = obj.size / 2 + playerRadius;
    if (distance < collisionDist) {
      return true; // Collision detected
    }
  }
  
  return false; // No collision
}

function keyPressed() {
  // Press SPACE to return to center
  if (key === ' ') {
    returningToCenter = true;
    returnProgress = 0;
    return false; // Prevent default behavior
  }
}

function mousePressed() {
  // Start audio and show intro screen on first click
  if (showStartScreen && soundtrack.isLoaded()) {
    showStartScreen = false;
    
    // Hide HTML start screen with fade
    document.getElementById('startScreen').classList.add('hidden');
    
    // Start the game immediately
    soundtrack.setVolume(0); // Set to 0 BEFORE starting playback
    soundtrack.loop();
    soundStarted = true;
    experienceStartTime = millis(); // Record start time
    
    // Show intro text overlay immediately
    showIntroScreen = true;
    document.getElementById('introScreen').classList.remove('hidden');
    
    // Hide intro after 15 seconds
    setTimeout(() => {
      document.getElementById('introScreen').classList.add('hidden');
      setTimeout(() => {
        showIntroScreen = false;
      }, 2000); // Wait for fade out
    }, 15000);
  }
}
