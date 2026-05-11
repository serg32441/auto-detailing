import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ArrowRight } from "lucide-react";

function WireframeSphere({
  position,
  radius,
  color,
  speed,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * speed;
      meshRef.current.rotation.x += delta * speed * 0.5;
    }
    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.x += delta * speed * (i % 2 === 0 ? 1 : -1);
        ring.rotation.z += delta * speed * 0.3;
      }
    });
  });

  const rings = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => ({
      rotation: [Math.PI * 0.3 * i, Math.PI * 0.2 * i, 0] as [number, number, number],
      scale: 1 + i * 0.15,
    }));
  }, []);

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[radius, 2]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.25} />
      </mesh>
      {rings.map((ring, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringRefs.current[i] = el;
          }}
          rotation={ring.rotation}
          scale={ring.scale}
        >
          <torusGeometry args={[radius, 0.02, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function ConnectingLines() {
  const linesRef = useRef<THREE.LineSegments>(null);

  const positions = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 4;
      points.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }

    const linePositions: number[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = points[i].distanceTo(points[j]);
        if (dist < 6) {
          linePositions.push(
            points[i].x, points[i].y, points[i].z,
            points[j].x, points[j].y, points[j].z
          );
        }
      }
    }
    return new Float32Array(linePositions);
  }, []);

  useFrame((_, delta) => {
    if (linesRef.current) {
      linesRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#191919" transparent opacity={0.1} />
    </lineSegments>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.01;
      particlesRef.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#191919" size={0.05} transparent opacity={0.3} />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <WireframeSphere position={[0, 0, 0]} radius={2} color="#191919" speed={0.15} />
      <WireframeSphere position={[-5, 2, -3]} radius={1} color="#191919" speed={0.2} />
      <WireframeSphere position={[4, -1, -4]} radius={0.8} color="#191919" speed={0.25} />
      <WireframeSphere position={[-2, -3, 2]} radius={0.6} color="#191919" speed={0.3} />
      <WireframeSphere position={[3, 3, 1]} radius={0.5} color="#191919" speed={0.18} />
      <ConnectingLines />
      <FloatingParticles />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI * 0.7}
        minPolarAngle={Math.PI * 0.3}
      />
    </>
  );
}

export default function Hero() {
  const scrollToBooking = () => {
    const el = document.getElementById("booking");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    const el = document.getElementById("services");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "#F5F5F5",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* 3D Canvas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
        }}
      >
        <Canvas
          camera={{ fov: 45, near: 0.1, far: 1000, position: [0, 0, 18] }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor("#F5F5F5");
          }}
        >
          <fog attach="fog" args={["#F5F5F5", 15, 60]} />
          <Scene />
        </Canvas>
      </div>

      {/* Text overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          padding: "0 5vw",
          maxWidth: "720px",
          marginTop: "48px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontFamily: "Manrope",
              fontSize: "12px",
              fontWeight: 400,
              color: "#191919",
              opacity: 0.5,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Детейлинг центр Москва
          </span>
        </div>
        <h1
          style={{
            fontFamily: "Manrope",
            fontSize: "clamp(36px, 6vw, 68px)",
            fontWeight: 400,
            color: "#191919",
            lineHeight: 1.1,
            marginBottom: "24px",
            letterSpacing: "-0.5px",
          }}
        >
          Премиальный уход
          <br />
          за вашим автомобилем
        </h1>
        <p
          style={{
            fontFamily: "Manrope",
            fontSize: "16px",
            fontWeight: 300,
            color: "#191919",
            opacity: 0.7,
            lineHeight: 1.6,
            marginBottom: "40px",
            maxWidth: "480px",
          }}
        >
          Полный комплекс детейлинг-услуг. От химчистки до керамического покрытия.
          Профессиональное оборудование и сертифицированные материалы.
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <button
            onClick={scrollToBooking}
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 400,
              color: "#191919",
              border: "1px solid #191919",
              borderRadius: "14px",
              padding: "14px 40px",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#191919";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#191919";
            }}
          >
            Оформить запись
            <ArrowRight size={18} />
          </button>
          <button
            onClick={scrollToServices}
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 300,
              color: "#191919",
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "14px 24px",
              opacity: 0.7,
              transition: "opacity 0.3s ease",
              textDecoration: "underline",
              textDecorationColor: "#E6E6E6",
              textUnderlineOffset: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            Смотреть услуги
          </button>
        </div>
      </div>
    </section>
  );
}
