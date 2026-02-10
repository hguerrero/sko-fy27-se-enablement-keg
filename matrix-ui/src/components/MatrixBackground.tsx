import React, { useEffect, useState } from 'react';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface MatrixChar {
  id: number;
  x: number;
  char: string;
  speed: number;
  opacity: number;
}

const MatrixBackground: React.FC = () => {
  const [chars, setChars] = useState<MatrixChar[]>([]);

  useEffect(() => {
    const numColumns = Math.floor(window.innerWidth / 20);
    const initialChars: MatrixChar[] = [];

    for (let i = 0; i < numColumns; i++) {
      for (let j = 0; j < 3; j++) {
        initialChars.push({
          id: i * 3 + j,
          x: i * 20,
          char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
          speed: 1 + Math.random() * 3,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    }

    setChars(initialChars);

    const interval = setInterval(() => {
      setChars(prevChars =>
        prevChars.map(char => ({
          ...char,
          char: Math.random() > 0.95 ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] : char.char,
        }))
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="matrix-bg">
      {chars.map(char => (
        <div
          key={char.id}
          className="matrix-rain absolute text-xs select-none pointer-events-none"
          style={{
            left: char.x,
            animationDuration: `${10 / char.speed}s`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: char.opacity,
          }}
        >
          {char.char}
        </div>
      ))}
    </div>
  );
};

export default MatrixBackground;