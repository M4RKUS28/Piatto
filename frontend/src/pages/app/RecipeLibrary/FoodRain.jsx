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

export default function FoodRain() {
  const [foodItems, setFoodItems] = useState([]);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Create food items with staggered spawn times over 2 seconds
    const allItems = Array.from({ length: 30 }, (_, index) => {
      const emoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
      return {
        id: index,
        emoji,
        x: Math.random() * 100, // percentage
        y: -10, // start above viewport
        velocityY: Math.random() * 0.05 + 0.05, // very slow initial velocity (0.05-0.1)
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1, // very slow rotation
        size: Math.random() * 1.5 + 1, // 1x to 2.5x size
        spawnTime: (index / 30) * 2000, // stagger over 2 seconds
        spawned: false
      };
    });

    const items = [];

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;

      // Spawn items that are due
      allItems.forEach(item => {
        if (!item.spawned && elapsed >= item.spawnTime) {
          items.push({ ...item, spawned: true });
          item.spawned = true;
        }
      });

      // Update positions with physics
      const updatedItems = items.map(item => {
        const gravity = 0.01; // very gentle gravity
        const newVelocityY = item.velocityY + gravity;
        const newY = item.y + newVelocityY;
        const newRotation = item.rotation + item.rotationSpeed;

        return {
          ...item,
          y: newY,
          velocityY: newVelocityY,
          rotation: newRotation
        };
      });

      // Remove items that are off screen
      const visibleItems = updatedItems.filter(item => item.y < 110);

      items.length = 0;
      items.push(...visibleItems);
      setFoodItems([...visibleItems]);

      // Continue animation if there are visible items or items still to spawn
      if (visibleItems.length > 0 || elapsed < 2000) {
        animationRef.current = requestAnimationFrame(animate);
      }
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
          className="absolute text-4xl transition-opacity"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: `rotate(${item.rotation}deg) scale(${item.size})`,
            opacity: item.y > 100 ? 0 : 1,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
