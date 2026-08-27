'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const HERO_IMAGES = [
  '/images/Hero/PHero1.png',
  '/images/Hero/PHero2.png',
  '/images/Hero/PHero3.jfif',
  '/images/Hero/hero.webp',
];

const INTERVAL = 6000;
const TRANSITION_DURATION = 1500;

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0">
      {HERO_IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          className="object-cover"
          sizes="100vw"
          style={{
            opacity: i === current ? 1 : 0,
            transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
    </div>
  );
}
