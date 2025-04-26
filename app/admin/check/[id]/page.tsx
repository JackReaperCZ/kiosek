'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, CircularProgress, Typography, Button, Textarea, Stack } from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NavigationBar from '../../../components/NavigationBar';
import { config } from '../../../utils/config';

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
  media: string[];
}

export default function CheckProject() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${config.apiUrl}/api/auth/validate/admin`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        setIsValidating(false);
      } catch (err) {
        router.push('/');
      }
    };

    validateToken();
  }, [router]);

  useEffect(() => {
    const fetchProject = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${config.apiUrl}/api/check/projects?id=${params.id}&examine=true`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch project');
        const projectData = await response.json();

        try {
          if (!projectData.name) throw new Error('No name found in response');

          // Parse the stringified arrays with better error handling
          let parsedTags = [];
          let parsedMedia = [];
          
          // Handle tags parsing
          if (projectData.tags) {
            if (typeof projectData.tags === 'string') {
              try {
                parsedTags = JSON.parse(projectData.tags);
              } catch (parseErr) {
                console.error('Error parsing tags:', parseErr);
                // If it's not valid JSON, check if it's an object with numeric keys
                if (projectData.tags.startsWith('{') && projectData.tags.includes(':')) {
                  try {
                    // Try to clean up and parse the malformed JSON
                    const cleanedJson = projectData.tags
                      .replace(/([{,])\s*(\d+):/g, '$1"$2":') // Make sure numeric keys are quoted
                      .replace(/([{,])\s*([a-zA-Z0-9_]+):/g, '$1"$2":'); // Make sure all keys are quoted
                    parsedTags = JSON.parse(cleanedJson);
                    // Convert from object to array if needed
                    if (!Array.isArray(parsedTags) && typeof parsedTags === 'object') {
                      parsedTags = Object.values(parsedTags);
                    }
                  } catch (cleanErr) {
                    console.error('Failed to clean and parse tags:', cleanErr);
                    parsedTags = [];
                  }
                }
              }
            } else if (Array.isArray(projectData.tags)) {
              // Already an array
              parsedTags = projectData.tags;
            } else if (typeof projectData.tags === 'object') {
              // Convert object to array
              parsedTags = Object.values(projectData.tags);
            }
          }
          
          // Handle media parsing
          if (projectData.media) {
            if (typeof projectData.media === 'string') {
              try {
                parsedMedia = JSON.parse(projectData.media);
              } catch (parseErr) {
                console.error('Error parsing media:', parseErr);
                // If it's not valid JSON, check if it's an object with numeric keys
                if (projectData.media.startsWith('{') && projectData.media.includes(':')) {
                  try {
                    // Try to clean up and parse the malformed JSON
                    const cleanedJson = projectData.media
                      .replace(/([{,])\s*(\d+):/g, '$1"$2":') // Make sure numeric keys are quoted
                      .replace(/([{,])\s*([a-zA-Z0-9_]+):/g, '$1"$2":'); // Make sure all keys are quoted
                    parsedMedia = JSON.parse(cleanedJson);
                    // Convert from object to array if needed
                    if (!Array.isArray(parsedMedia) && typeof parsedMedia === 'object') {
                      parsedMedia = Object.values(parsedMedia);
                    }
                  } catch (cleanErr) {
                    console.error('Failed to clean and parse media:', cleanErr);
                    parsedMedia = [];
                  }
                }
              }
            } else if (Array.isArray(projectData.media)) {
              // Already an array
              parsedMedia = projectData.media;
            } else if (typeof projectData.media === 'object') {
              // Convert object to array
              parsedMedia = Object.values(projectData.media);
            }
          }

          setProject({
            id: projectData.id,
            name: projectData.name,
            description: projectData.description || '',
            // Prepend the base URL for images
            thumbnail: `${config.apiUrl}/${projectData.thumbnail}`,
            tags: parsedTags,
            // Prepend the base URL for each media item
            media: parsedMedia.map((path: string) => `${config.apiUrl}/${path}`)
          });
          
          setLoading(false);
        } catch (err) {
          console.error('Parse error:', err);
          setError(`Failed to parse project data: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setLoading(false);
        }

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch project');
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const handleReview = async (approved: boolean) => {
    const token = localStorage.getItem('token');
    setSubmitting(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/check/projects/review?id=${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approved
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');
      
      // Redirect back to admin page after successful review
      router.push('/admin');
    } catch (err) {
      console.error('Review error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <CircularProgress size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
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
            Zpět na Control Panel
          </Button>

          <Box 
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 space-y-8"
            sx={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            <div className="border-b pb-6">
              <Typography 
                level="h1" 
                className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {project.name}
              </Typography>
            </div>
            
            <div className="space-y-4">
              <Typography level="h3" className="text-gray-700">Thumbnail</Typography>
              {project.thumbnail && (
                <div className="overflow-hidden">
                  <img 
                    src={project.thumbnail}
                    alt={project.name}
                    className="w-full max-h-[500px] object-contain"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Typography level="h3" className="text-gray-700">Štítky</Typography>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-blue-100/80 text-blue-800 rounded-full text-sm font-medium
                      backdrop-blur-sm transition-all hover:bg-blue-200/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Typography level="h3" className="text-gray-700">Popis</Typography>
              <div 
                className="prose max-w-none bg-white/50 rounded-xl p-6 backdrop-blur-sm"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            </div>

            <div className="space-y-4">
              <Typography level="h3" className="text-gray-700">Media</Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.media.map((url, index) => (
                  <div key={index} className="rounded-xl overflow-hidden shadow-lg bg-white/50 backdrop-blur-sm">
                    {url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') ? (
                      <video
                        src={url}
                        controls
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full aspect-video object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t pt-8">
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                className="pt-4"
              >
                <Button
                  fullWidth
                  variant="solid"
                  color="success"
                  size="lg"
                  onClick={() => handleReview(true)}
                  disabled={submitting}
                  startDecorator={submitting ? <CircularProgress size="sm" /> : <CheckCircleIcon />}
                  className="transition-all hover:scale-105"
                >
                  {submitting ? 'Schvalování...' : 'Schválit Projekt'}
                </Button>
                
                <Button
                  fullWidth
                  variant="solid"
                  color="danger"
                  size="lg"
                  onClick={() => handleReview(false)}
                  disabled={submitting}
                  startDecorator={submitting ? <CircularProgress size="sm" /> : <CancelIcon />}
                  className="transition-all hover:scale-105"
                >
                  {submitting ? 'Zamítání...' : 'Zamítnout Projekt'}
                </Button>
              </Stack>
            </div>
          </Box>
        </Container>
      </div>
    </>
  );
} 