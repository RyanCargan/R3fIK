import "./styles.css";
import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { Arrow } from "./Arrow";
import { useControls } from "leva";
import { LinearToneMapping } from "three";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

// Mesh simplification algorithm using Three.js from scratch

// Define the function for mesh simplification
function simplifyMesh(geometry, targetFaceCount) {
  // Calculate the number of faces in the original geometry
  const index = geometry.getIndex();
  const originalFaceCount = index.count / 3;

  console.log(originalFaceCount);

  // If the target face count is greater than or equal to the original face count, return the original geometry
  if (targetFaceCount >= originalFaceCount) {
    return geometry;
  }

  // Create a new geometry to store the simplified mesh
  const simplifiedGeometry = new THREE.BufferGeometry();

  // Copy the vertices from the original geometry to the simplified geometry
  geometry.vertices.forEach((vertex) => {
    simplifiedGeometry.vertices.push(vertex.clone());
  });

  // Create an array to store the face errors
  const faceErrors = [];

  // Calculate the error for each face and store it in the faceErrors array
  geometry.faces.forEach((face, index) => {
    const error = calculateFaceError(geometry, face);
    faceErrors.push({ index, error });
  });

  // Sort the faceErrors array in ascending order by error
  faceErrors.sort((a, b) => a.error - b.error);

  // Remove faces until the target face count is reached
  while (simplifiedGeometry.faces.length < targetFaceCount) {
    // Get the face with the lowest error
    const { index } = faceErrors.shift();

    // Remove the face from the original geometry
    geometry.faces.splice(index, 1);

    // Update the face indices in the geometry
    geometry.faces.forEach((face) => {
      face.a = face.a > index ? face.a - 1 : face.a;
      face.b = face.b > index ? face.b - 1 : face.b;
      face.c = face.c > index ? face.c - 1 : face.c;
    });

    // Remove any vertices that are no longer used by any faces
    geometry.vertices = geometry.vertices.filter((vertex, index) => {
      return geometry.faces.some((face) => {
        return face.a === index || face.b === index || face.c === index;
      });
    });

    // Copy the remaining vertices and faces to the simplified geometry
    simplifiedGeometry.vertices = geometry.vertices.map((vertex) =>
      vertex.clone()
    );
    simplifiedGeometry.faces = geometry.faces.map((face) => face.clone());

    // Recalculate the face errors
    faceErrors.length = 0;
    geometry.faces.forEach((face, index) => {
      const error = calculateFaceError(geometry, face);
      faceErrors.push({ index, error });
    });
    faceErrors.sort((a, b) => a.error - b.error);
  }

  // Return the simplified geometry
  return simplifiedGeometry;
}

// Define the function for calculating the error of a face
function calculateFaceError(geometry, face) {
  // Get the vertices of the face
  const { a, b, c } = face;
  const vertexA = geometry.vertices[a];
  const vertexB = geometry.vertices[b];
  const vertexC = geometry.vertices[c];

  // Calculate the normal of the face
  const normal = new THREE.Vector3();
  normal
    .crossVectors(vertexB.clone().sub(vertexA), vertexC.clone().sub(vertexA))
    .normalize();

  // Calculate the area of the face
  const area = normal.length() / 2;

  // Calculate the perimeter of the face
  const perimeter =
    vertexA.distanceTo(vertexB) +
    vertexB.distanceTo(vertexC) +
    vertexC.distanceTo(vertexA);

  // Calculate the error of the face
  const error = area * perimeter;

  // Return the error
  return error;
}

const Sphere = () => {
  const ref = useRef();
  const geometry = simplifyMesh(new THREE.SphereGeometry(1, 32, 32), 30);
  // const geometry = new THREE.SphereGeometry(1, 32, 32);

  console.log(geometry);

  useEffect(() => {
    console.log(ref.current);
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshBasicMaterial />
    </mesh>
  );
};

export default function App() {
  const { links } = useControls({
    links: {
      max: 100,
      min: 0,
      value: 0,
      step: 1
    }
  });

  const linkage = useMemo(() => {
    const dummy = [{ id: "root", child: [] }];
    let parent = dummy[0];
    for (let i = 0; i < links; i++) {
      const newLink = { id: i, child: [] };
      parent.child.push(newLink);
      parent = newLink;
    }
    return dummy;
  }, [links]);

  return (
    <div className="App">
      <Canvas
        gl={{
          alpha: false,
          antialias: false,
          powerPreference: "high-performance",
          toneMapping: LinearToneMapping
        }}
        camera={{ position: [0, 0, 40], near: 0.01, far: 20000 }}
        dpr={Math.min(2, window.devicePixelRatio)}
      >
        <Suspense fallback={null}>
          {/* {linkage.map((link) => {
            return <Arrow child={link.child} key={link.id} />;
          })} */}
          <Sphere />
          <ambientLight intensity={0.1} />
          <directionalLight intensity={0.5} position={[5, 0, 5]} />
          <directionalLight intensity={0.5} position={[-5, 0, 5]} />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
