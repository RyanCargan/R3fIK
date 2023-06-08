import { useFrame } from "@react-three/fiber";
import React, { useEffect, useState } from "react";
import { useRef } from "react";
import { MathUtils, Vector2 } from "three";

const tailLength = 2;
const headLength = 1;

const target = new Vector2();
const direction = new Vector2();
const arrowPosition = new Vector2();

export const Arrow = ({ position = [0, 0, 0], parent, child }) => {
  const arrow = useRef();

  const angle = (x, y) => Math.atan2(y, x);

  const follow = (targetX, targetY) => {
    target.set(targetX, targetY);
    direction.subVectors(target, arrowPosition);
    direction.setLength(headLength + tailLength / 2);
    direction.multiplyScalar(-1);
    arrowPosition.addVectors(target, direction);
    return arrowPosition;
  };

  useFrame((state) => {
    if (arrow.current) {
      arrowPosition.set(arrow.current.position.x, arrow.current.position.y);
      if (!parent) {
        const mouseX = (state.viewport.width / 2) * state.mouse.x;
        const mouseY = (state.viewport.height / 2) * state.mouse.y;
        const deltaX = arrow.current.position.x - mouseX;
        const deltaY = arrow.current.position.y - mouseY;
        arrow.current.rotation.z =
          angle(deltaX, deltaY) + MathUtils.degToRad(90);
        const { x, y, z } = follow(mouseX, mouseY);
        arrow.current.position.set(x, y, z);
      } else {
        if (parent.current) {
          const deltaX = arrow.current.position.x - parent.current.position.x;
          const deltaY = arrow.current.position.y - parent.current.position.y;
          arrow.current.rotation.z =
            angle(deltaX, deltaY) + MathUtils.degToRad(90);
          const { x, y, z } = follow(
            parent.current.position.x - tailLength / 2,
            parent.current.position.y - tailLength / 2
          );
          arrow.current.position.set(x, y, z);
        }
      }
    }
  });

  return (
    <>
      <group ref={arrow} position={position}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, tailLength, 10]} />
          <meshPhongMaterial />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <coneGeometry args={[0.4, headLength, 10]} />
          <meshPhongMaterial />
        </mesh>
      </group>
      {child &&
        child.map((link) => {
          return <Arrow parent={arrow} child={link.child} key={link.id} />;
        })}
    </>
  );
};
