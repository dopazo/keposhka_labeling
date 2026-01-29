/**
 * Keposhka Labeler - Main Application Component
 */

import { useEffect } from 'react';
import { EditorPanel } from '@/components/EditorPanel';
import { StageBoard } from '@/components/canvas/StageBoard';
import { ReferencePanel } from '@/components/ReferencePanel';
import { useStore } from '@/store/useStore';

function App() {
  const { setImages } = useStore();

  useEffect(() => {
    // Fetch images from backend
    fetch('/api/images')
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
      })
      .catch((error) => {
        console.error('Error fetching images:', error);
      });
  }, [setImages]);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Panel - Editor & File List */}
      <EditorPanel />

      {/* Center Panel - Canvas */}
      <div className="flex-1 flex flex-col">
        <StageBoard />
      </div>

      {/* Right Panel - Reference */}
      <div className="w-80">
        <ReferencePanel />
      </div>
    </div>
  );
}

export default App;
