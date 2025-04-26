'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, CircularProgress, Typography, Button, Chip } from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigationBar from '../../components/NavigationBar';
import { config } from '../../utils/config';

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  tags: string;
  thumbnail: string;
  media: string;
  created: string;
}

interface ProcessedProject {
  id: string;
  name: string;
  description: string;
  tags: string[];
  thumbnail: string;
  media: string[];
  created: string;
}

const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

const VideoThumbnail = ({ videoUrl }: { videoUrl: string }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = `${config.apiUrl}/${videoUrl}`;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.onloadeddata = () => {
      video.currentTime = 1; // Set to 1 second to skip potential black frames
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      setThumbnailUrl(canvas.toDataURL('image/jpeg'));
    };
  }, [videoUrl]);

  return (
    <div className="relative w-full h-full">
      <img
        src={thumbnailUrl || '/video-placeholder.png'} // Add a placeholder image in your public folder
        alt="Video thumbnail"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[18px] border-l-gray-800 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
        </div>
      </div>
    </div>
  );
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProcessedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/project?id=${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch project details');
        const data: ProjectDetails = await response.json();

        // Process the data
        const processedProject: ProcessedProject = {
          id: data.id,
          name: data.name,
          description: data.description,
          thumbnail: data.thumbnail,
          tags: JSON.parse(data.tags || '[]'),
          media: JSON.parse(data.media || '[]'),
          created: data.created || new Date().toISOString()
        };

        setProject(processedProject);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch project details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProjectDetails();
    }
  }, [params.id]);

  // Function to handle media rotation
  const rotateMedia = () => {
    if (!project) return;
    
    // Check if current media is a video and is playing
    const allMedia = [project.thumbnail, ...project.media];
    const currentMedia = allMedia[currentMediaIndex];
    
    if (isVideoFile(currentMedia) && videoRef.current && !videoRef.current.paused) {
      return; // Don't rotate if video is playing
    }
    
    setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % allMedia.length);
  };

  // Setup carousel interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const startCarousel = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(rotateMedia, 5000);
    };

    const stopCarousel = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    if (project) {
      startCarousel();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [project, currentMediaIndex]); // Added currentMediaIndex as dependency

  // Video event handlers
  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = undefined;
    }
  };

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
    // Move to next media after video ends
    const allMedia = [project!.thumbnail, ...project!.media];
    setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % allMedia.length);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
    // Restart carousel only if we're not at the end of the video
    if (videoRef.current && videoRef.current.currentTime < videoRef.current.duration - 0.5) {
      carouselIntervalRef.current = setInterval(rotateMedia, 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <CircularProgress size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 text-red-500">
          {error || 'Project not found'}
        </div>
      </div>
    );
  }

  const renderCurrentMedia = () => {
    if (!project) return null;

    const allMedia = [project.thumbnail, ...project.media];
    const currentMedia = allMedia[currentMediaIndex];

    return isVideoFile(currentMedia) ? (
      <video
        ref={videoRef}
        src={`${config.apiUrl}/${currentMedia}`}
        controls
        controlsList="nodownload"
        preload="metadata"
        className="w-full max-h-[500px] object-contain"
        onPlay={handleVideoPlay}
        onEnded={handleVideoEnd}
        onPause={handleVideoPause}
      >
        <source src={`${config.apiUrl}/${currentMedia}`} type={`video/${currentMedia.split('.').pop()}`} />
        Your browser does not support the video tag.
      </video>
    ) : (
      <img 
        src={`${config.apiUrl}/${currentMedia}`}
        alt={project.name}
        className="w-full max-h-[500px] object-contain"
      />
    );
  };

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16">
        <Container className="py-8 px-4">
          <Button
            onClick={() => router.back()}
            startDecorator={<ArrowBackIcon />}
            variant="soft"
            color="neutral"
            className="mb-6"
          >
            Zpět na hlavní stránku
          </Button>

          <Box 
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 space-y-8"
            sx={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            {/* Project Header */}
            <div className="border-b pb-6">
              <Typography 
                level="h1" 
                className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {project.name}
              </Typography>
              <div className="flex flex-wrap gap-2 mt-4">
                {project.tags.map((tag, index) => (
                  <Chip
                    key={`${tag}-${index}`}
                    variant="soft"
                    color="primary"
                    size="sm"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
              <Typography level="body-sm" className="text-gray-600 mt-2">
                Vytvořeno {new Date(project.created).toLocaleDateString()}
              </Typography>
            </div>

            {/* Media Carousel */}
            <div className="space-y-4">
              {/* Main Display */}
              <div className="overflow-hidden rounded-xl">
                {renderCurrentMedia()}
              </div>
              {/* Navigation Dots */}
              <div className="flex justify-center gap-2">
                {project?.media && [...Array(project.media.length + 1)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentMediaIndex(index);
                      if (isVideoPlaying && videoRef.current) {
                        videoRef.current.pause();
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentMediaIndex === index 
                        ? 'bg-blue-600 w-4' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to media ${index + 1}`}
                  />
                ))}
              </div>

              {/* Thumbnails Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                {/* Thumbnail */}
                <div 
                  onClick={() => {
                    setCurrentMediaIndex(0);
                    if (isVideoPlaying && videoRef.current) {
                      videoRef.current.pause();
                    }
                  }}
                  className={`
                    aspect-video rounded-lg overflow-hidden cursor-pointer
                    transition-all hover:opacity-80
                    ${currentMediaIndex === 0 ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  `}
                >
                  <img
                    src={`${config.apiUrl}/${project.thumbnail}`}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Media Items */}
                {project.media.map((mediaUrl, index) => (
                  <div
                    key={`thumb-${index}`}
                    onClick={() => {
                      setCurrentMediaIndex(index + 1);
                      if (isVideoPlaying && videoRef.current) {
                        videoRef.current.pause();
                      }
                    }}
                    className={`
                      aspect-video rounded-lg overflow-hidden cursor-pointer
                      transition-all hover:opacity-80
                      ${currentMediaIndex === index + 1 ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    `}
                  >
                    {isVideoFile(mediaUrl) ? (
                      <VideoThumbnail videoUrl={mediaUrl} />
                    ) : (
                      <img
                        src={`${config.apiUrl}/${mediaUrl}`}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Description */}
            <div className="space-y-4">
              <Typography level="h3" className="text-gray-700">Popis</Typography>
              <div 
                className="prose prose-blue max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            </div>
          </Box>
        </Container>
      </div>
    </>
  );
} 