'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { StoryExperience } from '../../components/story/story-experience';

export default function StoryPage() {
  const router = useRouter();

  const handleEnterTerminal = (targetView?: string) => {
    if (targetView) {
      router.push(`/?view=${targetView}`);
    } else {
      router.push('/');
    }
  };

  return <StoryExperience onEnterTerminal={handleEnterTerminal} />;
}
