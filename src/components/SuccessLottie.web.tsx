import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function SuccessLottie({ onFinish }: { onFinish: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onFinish, 900);
    return () => clearTimeout(t);
  }, [onFinish]);

  return <Ionicons name="checkmark-circle" size={120} color="#4CAF50" />;
}


