import React, { useEffect, useState, useRef } from 'react';

const FOOD_EMOJIS = [
  '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇',
  '🥞', '🧈', '🍞', '🥐', '🥖', '🥨', '🥯', '🧀', '🍖', '🍗',
  '🥩', '🥪', '🌮', '🌯', '🥙', '🧆', '🥘', '🍝', '🍜', '🍲',
  '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍥', '🥠', '🥮',
  '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮',
  '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛',
  '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷',
  '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣',
  '🥗', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎',
  '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥'
];

const GRAVITY = 0.15; // gentler acceleration
const RESTITUTION = 0.6; // bounciness (0 = no bounce, 1 = perfect bounce)
const FRICTION = 1.0; // velocity damping
const GROUND_FRICTION = 0.95;
const ROTATION_DAMPING = 0.95; // damping for rotation
const MIN_VELOCITY = 0.01; // threshold to stop moving
const MIN_ROTATION_SPEED = 0.1; // threshold to stop rotating

export default function FoodRain() {
  const [foodItems, setFoodItems] = useState([]);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Create food items with staggered spawn times over 2 seconds
    const allItems = Array.from({ length: 30 }, (_, index) => {
      const emoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
      const size = Math.random() * 0.6 + 1.0; // size range (1.0-1.6)
      return {
        id: index,
        emoji,
        // Use pixel values for physics calculations
        x: Math.random() * window.innerWidth,
        y: -50,
        velocityX: 0,
        velocityY: Math.random() * 0.5 + 1.0, // faster initial velocity (1.0-1.5)
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 3, // slightly faster initial rotation
        size: size,
        radius: (size * 20), // approximate radius in pixels for collision
        spawnTime: (index / 30) * 2000,
        spawned: false
      };
    });

    const items = [];

    // Check collision between two circles
    const checkCollision = (item1, item2) => {
      const dx = item2.x - item1.x;
      const dy = item2.y - item1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = item1.radius + item2.radius;
      return distance < minDistance;
    };

    // Resolve collision between two items
    const resolveCollision = (item1, item2) => {
      const dx = item2.x - item1.x;
      const dy = item2.y - item1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0) return; // avoid division by zero

      const minDistance = item1.radius + item2.radius;
      const overlap = minDistance - distance;

      // Normalize collision vector
      const nx = dx / distance;
      const ny = dy / distance;

      // Separate items
      const separationX = (overlap / 2) * nx;
      const separationY = (overlap / 2) * ny;

      item1.x -= separationX;
      item1.y -= separationY;
      item2.x += separationX;
      item2.y += separationY;

      // Calculate relative velocity
      const dvx = item2.velocityX - item1.velocityX;
      const dvy = item2.velocityY - item1.velocityY;

      // Relative velocity in collision normal direction
      const relativeVelocity = dvx * nx + dvy * ny;

      // Don't resolve if velocities are separating
      if (relativeVelocity > 0) return;

      // Calculate impulse
      const impulse = -(1 + RESTITUTION) * relativeVelocity / 2;

      // Apply impulse
      item1.velocityX -= impulse * nx;
      item1.velocityY -= impulse * ny;
      item2.velocityX += impulse * nx;
      item2.velocityY += impulse * ny;
    };

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const viewportHeight = window.innerHeight;
      const groundY = viewportHeight - 50; // pile forms 50px from bottom

      // Spawn items that are due
      allItems.forEach(item => {
        if (!item.spawned && elapsed >= item.spawnTime) {
          items.push({ ...item, spawned: true });
          item.spawned = true;
        }
      });

      // Update physics for all items
      items.forEach(item => {
        // Apply gravity
        item.velocityY += GRAVITY;

        // Apply velocity
        item.x += item.velocityX;
        item.y += item.velocityY;

        // Apply friction
        item.velocityX *= FRICTION;
        item.velocityY *= FRICTION;

        // Update rotation with damping
        item.rotation += item.rotationSpeed;

        // Calculate total velocity for damping
        const totalVelocity = Math.sqrt(item.velocityX * item.velocityX + item.velocityY * item.velocityY);

        // Apply rotation damping when moving slowly or on ground
        if (totalVelocity < 0.5 || item.y + item.radius >= groundY - 1) {
          item.rotationSpeed *= ROTATION_DAMPING;

          // Stop rotation if too slow
          if (Math.abs(item.rotationSpeed) < MIN_ROTATION_SPEED) {
            item.rotationSpeed = 0;
          }
        }

        // Ground collision
        if (item.y + item.radius > groundY) {
          item.y = groundY - item.radius;
          item.velocityY *= -RESTITUTION;
          item.velocityX *= GROUND_FRICTION;
          item.rotationSpeed *= GROUND_FRICTION; // reduce rotation on ground impact

          // Stop if velocity is too small
          if (Math.abs(item.velocityY) < MIN_VELOCITY) {
            item.velocityY = 0;
          }
          if (Math.abs(item.velocityX) < MIN_VELOCITY) {
            item.velocityX = 0;
          }
        }

        // Wall collisions
        if (item.x - item.radius < 0) {
          item.x = item.radius;
          item.velocityX *= -RESTITUTION;
        }
        if (item.x + item.radius > window.innerWidth) {
          item.x = window.innerWidth - item.radius;
          item.velocityX *= -RESTITUTION;
        }
      });

      // Check collisions between items (multiple passes for better accuracy)
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            if (checkCollision(items[i], items[j])) {
              resolveCollision(items[i], items[j]);
            }
          }
        }
      }

      setFoodItems([...items]);

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {foodItems.map(item => (
        <div
          key={item.id}
          className="absolute text-4xl"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.size})`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
