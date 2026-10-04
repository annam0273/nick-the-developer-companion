import React from 'react';
import './FoxCorner.css';
import { useMovement } from '../Fox/character-movement';
import Character from '../Fox/Character';

export default function FoxCorner() {
  const movementState = useMovement();

  return (
    <div 
      className={`mochi-fox-corner ${movementState.isDragging ? 'mochi-dragging' : ''}`}
      onPointerDown={movementState.handlePointerDown}
      style={{
        transform: `translate(${movementState.cornerPos.x}px, ${movementState.cornerPos.y}px)`,
      }}
    >
      {/* The Fox sits in the foreground and animates via charOffset */}
      <div 
        className="mochi-corner-fox"
        style={{
          transform: `translate(${movementState.charOffset.x}px, ${movementState.charOffset.y}px)`,
          transition: (movementState.transitionDuration > 0 && !movementState.isDragging) 
            ? `transform ${movementState.transitionDuration}s ease-in-out` 
            : 'none',
        }}
      >
        <Character movementState={movementState} />
      </div>
    </div>
  );
}
