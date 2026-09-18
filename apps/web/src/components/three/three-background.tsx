'use client';

import * as React from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  enabled?: boolean;
  lowPowerMode?: boolean;
  className?: string;
}

export function ThreeBackground({
  enabled = true,
  lowPowerMode = false,
  className = '',
}: ThreeBackgroundProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = React.useState(true);

  React.useEffect(() => {
    if (!enabled) return;

    // Test WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x071423, 0.015);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 2, 28);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPowerMode,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerMode ? 1 : 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x071423, 1);
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const goldPointLight = new THREE.PointLight(0xf5a623, 3, 50);
    goldPointLight.position.set(-12, 10, 10);
    scene.add(goldPointLight);

    const cyanPointLight = new THREE.PointLight(0x00f2fe, 3, 50);
    cyanPointLight.position.set(14, -8, 12);
    scene.add(cyanPointLight);

    // 5. Globe Group (Wireframe Globe & Network Nodes)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroup.position.set(8, -1, 0);

    // Inner wireframe sphere
    const globeRadius = 10;
    const globeGeometry = new THREE.IcosahedronGeometry(globeRadius, lowPowerMode ? 2 : 4);
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0x143452,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // Latitude & Longitude accent rings
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = globeRadius * Math.sin(((i + 1) / (ringCount + 1)) * Math.PI);
      const ringY = globeRadius * Math.cos(((i + 1) / (ringCount + 1)) * Math.PI);
      const ringGeo = new THREE.RingGeometry(ringRadius - 0.04, ringRadius + 0.04, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = ringY;
      globeGroup.add(ringMesh);
    }

    // Exchange Hub Nodes on Globe
    const exchangeCoords = [
      { name: 'Tokyo', lat: 35.6, lon: 139.6, color: 0x00f2fe },
      { name: 'New York', lat: 40.7, lon: -74.0, color: 0xf5a623 },
      { name: 'London', lat: 51.5, lon: -0.1, color: 0x10b981 },
      { name: 'Singapore', lat: 1.3, lon: 103.8, color: 0x00f2fe },
      { name: 'Frankfurt', lat: 50.1, lon: 8.6, color: 0xf5a623 },
      { name: 'Sao Paulo', lat: -23.5, lon: -46.6, color: 0x10b981 },
      { name: 'Sydney', lat: -33.8, lon: 151.2, color: 0x00f2fe },
    ];

    function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      );
    }

    const hubPositions: THREE.Vector3[] = [];
    exchangeCoords.forEach((hub) => {
      const pos = latLonToVector3(hub.lat, hub.lon, globeRadius + 0.1);
      hubPositions.push(pos);

      // Node pin
      const nodeGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: hub.color,
        emissive: hub.color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      globeGroup.add(nodeMesh);
    });

    // Exchange Connection Arcs
    const arcPointsList: THREE.Vector3[][] = [];
    for (let i = 0; i < hubPositions.length; i++) {
      const nextIdx = (i + 1) % hubPositions.length;
      const p1 = hubPositions[i];
      const p2 = hubPositions[nextIdx];

      // Midpoint elevated above surface
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const elevation = 1 + (p1.distanceTo(p2) / globeRadius) * 1.5;
      mid.normalize().multiplyScalar(globeRadius * elevation);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(36);
      arcPointsList.push(points);

      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x00f2fe : 0xf5a623,
        transparent: true,
        opacity: 0.45,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);
    }

    // Flowing Signal Pulses
    const pulseCount = arcPointsList.length * 2;
    const pulseGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pulseMeshes: { mesh: THREE.Mesh; arcIndex: number; progress: number; speed: number }[] =
      [];

    for (let i = 0; i < pulseCount; i++) {
      const mesh = new THREE.Mesh(pulseGeo, pulseMat);
      globeGroup.add(mesh);
      pulseMeshes.push({
        mesh,
        arcIndex: i % arcPointsList.length,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
      });
    }

    // 6. Floating 3D Crypto Coins
    const coinsGroup = new THREE.Group();
    scene.add(coinsGroup);

    // Bitcoin Gold Coin (Cylinder)
    const btcGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.28, 32);
    const btcMat = new THREE.MeshStandardMaterial({
      color: 0xf5a623,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x945b00,
      emissiveIntensity: 0.2,
    });
    const btcCoin = new THREE.Mesh(btcGeo, btcMat);
    btcCoin.position.set(-11, 4, 6);
    btcCoin.rotation.x = Math.PI / 4;
    coinsGroup.add(btcCoin);

    // Ethereum Diamond (Octahedron)
    const ethGeo = new THREE.OctahedronGeometry(1.5, 0);
    const ethMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x006180,
      emissiveIntensity: 0.3,
    });
    const ethCoin = new THREE.Mesh(ethGeo, ethMat);
    ethCoin.position.set(-14, -4, 4);
    ethCoin.scale.set(1, 1.6, 1);
    coinsGroup.add(ethCoin);

    // Solana Octagonal Prism
    const solGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.25, 8);
    const solMat = new THREE.MeshStandardMaterial({
      color: 0x9945ff,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x471680,
      emissiveIntensity: 0.3,
    });
    const solCoin = new THREE.Mesh(solGeo, solMat);
    solCoin.position.set(-8, -8, 8);
    solCoin.rotation.y = Math.PI / 6;
    coinsGroup.add(solCoin);

    // 7. Ambient Particle Field
    const particleCount = lowPowerMode ? 150 : 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 80;
      particlePos[i + 1] = (Math.random() - 0.5) * 60;
      particlePos[i + 2] = (Math.random() - 0.5) * 50;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x3d7099,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. Glowing Light Ribbons
    const ribbonCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-25, 12, -10),
        new THREE.Vector3(-10, 4, 0),
        new THREE.Vector3(5, -6, 5),
        new THREE.Vector3(25, -12, -5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-20, -14, -5),
        new THREE.Vector3(-4, -2, 4),
        new THREE.Vector3(12, 8, 2),
        new THREE.Vector3(30, 14, -8),
      ]),
    ];

    ribbonCurves.forEach((curve, idx) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x00f2fe : 0xf5a623,
        transparent: true,
        opacity: 0.3,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
    });

    // 9. Parallax & Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (e: PointerEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX * 2.5 - targetX) * 0.03;
      targetY += (-mouseY * 2.0 - targetY) * 0.03;

      camera.position.x = targetX + Math.sin(elapsedTime * 0.2) * 0.6;
      camera.position.y = 2 + targetY + Math.cos(elapsedTime * 0.25) * 0.4;
      camera.lookAt(0, 0, 0);

      // Rotate globe
      globeGroup.rotation.y = elapsedTime * 0.08;
      globeGroup.rotation.x = Math.sin(elapsedTime * 0.04) * 0.1;

      // Animate floating coins
      btcCoin.rotation.y = elapsedTime * 0.8;
      btcCoin.rotation.z = Math.sin(elapsedTime * 0.6) * 0.2;
      btcCoin.position.y = 4 + Math.sin(elapsedTime * 0.8) * 0.5;

      ethCoin.rotation.y = -elapsedTime * 0.9;
      ethCoin.position.y = -4 + Math.cos(elapsedTime * 0.7) * 0.6;

      solCoin.rotation.x = elapsedTime * 0.7;
      solCoin.rotation.y = elapsedTime * 0.5;
      solCoin.position.y = -8 + Math.sin(elapsedTime * 0.9) * 0.4;

      // Update pulse signals along arcs
      pulseMeshes.forEach((pulse) => {
        pulse.progress += pulse.speed;
        if (pulse.progress > 1) pulse.progress = 0;

        const pts = arcPointsList[pulse.arcIndex];
        const ptIndex = Math.floor(pulse.progress * (pts.length - 1));
        const nextPtIndex = Math.min(ptIndex + 1, pts.length - 1);
        const fraction = pulse.progress * (pts.length - 1) - ptIndex;

        const pos = new THREE.Vector3().lerpVectors(pts[ptIndex], pts[nextPtIndex], fraction);
        pulse.mesh.position.copy(pos);
      });

      // Slowly rotate particle field
      particles.rotation.y = -elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      globeGeometry.dispose();
      globeMaterial.dispose();
      btcGeo.dispose();
      btcMat.dispose();
      ethGeo.dispose();
      ethMat.dispose();
      solGeo.dispose();
      solMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [enabled, lowPowerMode]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#071423] ${className}`}
      aria-hidden="true"
    >
      {!webglSupported && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#071423] via-[#0b1d30] to-[#06101c]" />
      )}
    </div>
  );
}
