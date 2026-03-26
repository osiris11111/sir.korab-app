import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden" style={{ width: '100%', height: '100%' }}>
      <Canvas 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} 
        camera={{ position: [0, 0, 6] }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[10, 10, 10]} intensity={3} />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#ffffff" />
        <Float speed={2.5} rotationIntensity={2} floatIntensity={3}>
          <Sphere args={[2.2, 64, 64]}>
            <MeshDistortMaterial
              color="#ffffff"
              emissive="#222222"
              attach="material"
              distort={0.6}
              speed={2}
              roughness={0.2}
              metalness={0.8}
              wireframe={true}
            />
          </Sphere>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
      {/* Very subtle gradient overlay at the bottom only */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>
    </div>
  );
}
