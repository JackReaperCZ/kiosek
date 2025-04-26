'use client';

import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/joy';
import { config } from '../utils/config';

interface ProjectThumbnailProps {
  projectData: {
    thumbnail: File | null;
    existingThumbnail?: string;
  };
  setProjectData: (data: any) => void;
  existingThumbnail?: string;
}

export default function ProjectThumbnail({ projectData, setProjectData }: ProjectThumbnailProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    // Create preview URL from existing thumbnail when component mounts or thumbnail changes
    if (projectData.thumbnail) {
      const url = URL.createObjectURL(projectData.thumbnail);
      setPreviewUrl(url);
      
      // Cleanup URL when component unmounts or thumbnail changes
      return () => URL.revokeObjectURL(url);
    }
  }, [projectData.thumbnail]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProjectData((prev: any) => ({
        ...prev,
        thumbnail: file,
        existingThumbnail: undefined // Clear existing thumbnail when new one is selected
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Show existing thumbnail if available */}
        {projectData.existingThumbnail && !projectData.thumbnail && (
          <div className="relative">
            <img
              src={`${config.apiUrl}/${projectData.existingThumbnail}`}
              alt="Current thumbnail"
              className="max-w-xl rounded-xl shadow-lg"
            />
            <button
              onClick={() => setProjectData((prev: any) => ({ ...prev, existingThumbnail: undefined }))}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              Odebrat
            </button>
          </div>
        )}

        {/* Show new thumbnail preview if selected */}
        {projectData.thumbnail && (
          <div className="relative">
            <img
              src={URL.createObjectURL(projectData.thumbnail)}
              alt="New thumbnail"
              className="max-w-xl rounded-xl shadow-lg"
            />
            <button
              onClick={() => setProjectData((prev: any) => ({ ...prev, thumbnail: null }))}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleThumbnailChange}
          className="hidden"
          id="thumbnail-upload"
        />
        <label
          htmlFor="thumbnail-upload"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
        >
          {projectData.existingThumbnail || projectData.thumbnail ? 'Změnit Thumbnail' : 'Nahrát Thumbnail'}
        </label>
      </div>
    </div>
  );
} 