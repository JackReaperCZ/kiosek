'use client';

import DOMPurify from 'dompurify';
import { config } from '../utils/config';

interface ProjectPreviewProps {
  projectData: {
    name: string;
    tags: string[];
    description: string;
    thumbnail: File | null;
    existingThumbnail?: string;
    media: File[];
    existingMedia?: string[];
  };
}

export default function ProjectPreview({ projectData }: ProjectPreviewProps) {
  const isVideoFile = (filename: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    return videoExtensions.some(ext => 
      typeof filename === 'string' && filename.toLowerCase().endsWith(ext)
    );
  };

  // Add sanitization function
  const sanitizeInput = (input: string) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'br'],
      ALLOWED_ATTR: ['style', 'class'],
    });
  };

  // Add name sanitization
  const sanitizedName = DOMPurify.sanitize(projectData.name, { ALLOWED_TAGS: [] });

  // Add tags sanitization
  const sanitizedTags = projectData.tags.map(tag => 
    DOMPurify.sanitize(tag, { ALLOWED_TAGS: [] })
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 px-4 text-black text-bold">
      <div>
        <h3 className="text-xl font-semibold mb-3">Název projektu</h3>
        <p className="text-lg">{sanitizedName}</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3 text-black text-bold">Štítky</h3>
        <div className="flex flex-wrap gap-2">
          {sanitizedTags.map((tag: string, index: number) => (
            <span key={index} className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3 text-black text-bold">Popis projektu</h3>
        <div 
          className="prose prose-neutral w-full text-black"
          dangerouslySetInnerHTML={{ 
            __html: sanitizeInput(projectData.description)
          }}
        />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Thumbnail</h3>
        {projectData.thumbnail ? (
          <img
            src={URL.createObjectURL(projectData.thumbnail)}
            alt="New project thumbnail"
            className="w-full max-w-2xl rounded-xl shadow-lg"
          />
        ) : projectData.existingThumbnail ? (
          <img
            src={`${config.apiUrl}/${projectData.existingThumbnail}`}
            alt="Existing project thumbnail"
            className="w-full max-w-2xl rounded-xl shadow-lg"
          />
        ) : null}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Media</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Existing Media */}
          {projectData.existingMedia?.map((mediaUrl, index) => (
            <div key={`existing-${index}`} className="aspect-video">
              {isVideoFile(mediaUrl) ? (
                <video
                  src={`${config.apiUrl}/${mediaUrl}`}
                  controls
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : (
                <img
                  src={`${config.apiUrl}/${mediaUrl}`}
                  alt={`Existing media ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              )}
            </div>
          ))}

          {/* New Media */}
          {projectData.media.map((file: File, index: number) => (
            <div key={`new-${index}`} className="aspect-video">
              {file.type.startsWith('video/') ? (
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : (
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New media ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 