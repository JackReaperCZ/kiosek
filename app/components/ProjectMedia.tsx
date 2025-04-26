'use client';

import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/joy';
import { config } from '../utils/config';
interface ProjectMediaProps {
  projectData: {
    media: File[];
    existingMedia?: string[];
    originalMedia?: string[];
  };
  setProjectData: (data: any) => void;
  existingMedia?: string[];
}

export default function ProjectMedia({ projectData, setProjectData }: ProjectMediaProps) {
  const [previews, setPreviews] = useState<Array<{ url: string; type: string }>>([]);

  useEffect(() => {
    const urls = projectData.media.map((file: File) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setPreviews(urls);

    return () => {
      urls.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [projectData.media]);

  const isValidFileType = (file: File) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    return [...allowedImageTypes, ...allowedVideoTypes].includes(file.type);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => isValidFileType(file));
    
    if (validFiles.length !== files.length) {
      alert('Některé soubory mají nepovolený formát. Povolené formáty jsou: JPG, PNG, GIF, WEBP, MP4, MOV, WEBM');
      return;
    }

    setProjectData((prev: any) => ({
      ...prev,
      media: [...prev.media, ...validFiles]
    }));
  };

  const removeExistingMedia = (index: number) => {
    setProjectData((prev: any) => ({
      ...prev,
      existingMedia: prev.existingMedia?.filter((_: any, i: number) => i !== index)
    }));
  };

  const removeNewMedia = (index: number) => {
    setProjectData((prev: any) => ({
      ...prev,
      media: prev.media.filter((_: any, i: number) => i !== index)
    }));
  };

  const isVideoFile = (filename: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  return (
    <div className="space-y-4">
      {/* Existing Media */}
      {projectData.existingMedia && projectData.existingMedia.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectData.existingMedia.map((mediaUrl, index) => (
            <div key={`existing-${index}`} className="relative">
              {isVideoFile(mediaUrl) ? (
                  <video
                    src={`${config.apiUrl}/${mediaUrl}`}
                  controls
                  className="w-full aspect-video object-cover rounded-xl shadow-lg"
                />
              ) : (
                <img
                  src={`${config.apiUrl}/${mediaUrl}`}
                  alt={`Media ${index + 1}`}
                  className="w-full aspect-video object-cover rounded-xl shadow-lg"
                />
              )}
              <button
                onClick={() => removeExistingMedia(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                Odebrat
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Media */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectData.media.map((file, index) => (
          <div key={`new-${index}`} className="relative">
            {file.type.startsWith('video/') ? (
              <video
                src={URL.createObjectURL(file)}
                controls
                className="w-full aspect-video object-cover rounded-xl shadow-lg"
              />
            ) : (
              <img
                src={URL.createObjectURL(file)}
                alt={`Media ${index + 1}`}
                className="w-full aspect-video object-cover rounded-xl shadow-lg"
              />
            )}
            <button
              onClick={() => removeNewMedia(index)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              Odebrat
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleMediaChange}
          className="hidden"
          id="media-upload"
        />
        <label
          htmlFor="media-upload"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
        >Přidat média
        </label>
      </div>
    </div>
  );
} 