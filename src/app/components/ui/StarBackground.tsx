"use client";

import { useEffect, useState } from 'react';

export default function StarBackground() {
  const [isClient, setIsClient] = useState(false);
  
  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until client-side
  if (!isClient) {
    return <div className="fixed inset-0 z-[-20] overflow-hidden" />;
  }

  return (
    <div className="fixed inset-0 z-[-20] overflow-hidden">
      {/* Simplified static background - no gradients, just a subtle color overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/20 to-black opacity-80 z-[-19]" />
    </div>
  );
} 