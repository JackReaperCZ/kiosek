'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Stepper, Step, StepButton, StepIndicator, Button, Container, CircularProgress } from '@mui/joy';
import Check from '@mui/icons-material/Check';
import ProjectInfo from '../../components/ProjectInfo';
import ProjectDescription from '../../components/ProjectDescription';
import ProjectThumbnail from '../../components/ProjectThumbnail';
import ProjectMedia from '../../components/ProjectMedia';
import ProjectPreview from '../../components/ProjectPreview';
import { validateProject, validateStep } from '../../utils/validation';
import NavigationBar from '../../components/NavigationBar';
import { config } from '../../utils/config';

interface ProjectData {
  name: string;
  tags: string[];
  description: string;
  thumbnail: File | null;
  media: File[];
  existingThumbnail?: string;
  existingMedia?: string[];
  originalMedia?: string[];
}

export default function EditProject() {
  const params = useParams();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    tags: [],
    description: '',
    thumbnail: null,
    media: [],
    existingThumbnail: '',
    existingMedia: [],
    originalMedia: []
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Token validation
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${config.apiUrl}/api/auth/validateOwner?id=${params.id}`, {
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
        router.push('/login');
      }
    };

    validateToken();
  }, [router]);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${config.apiUrl}/api/project/edit?id=${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch project');
        const data = await response.json();

        console.log('Received data:', data);

        // Parse the data and set the project state
        setProjectData({
          name: data.name || '',
          description: data.description || '',
          tags: data.tags ? (typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags) : [],
          thumbnail: null,
          media: [],
          existingThumbnail: data.thumbnail ? data.thumbnail.replace(/\\/g, '/') : '',
          existingMedia: data.media ? (typeof data.media === 'string' ? JSON.parse(data.media) : data.media).map((path: string) => path.replace(/\\/g, '/')) : [],
          originalMedia: data.media ? (typeof data.media === 'string' ? JSON.parse(data.media) : data.media).map((path: string) => path.replace(/\\/g, '/')) : []
        });

        // Handle case where Tags is an object with numeric keys instead of an array
        if (data.tags && typeof data.tags === 'object' && !Array.isArray(data.tags)) {
          // Convert object like {0: "tag1", 1: "tag2"} to array ["tag1", "tag2"]
          data.tags = Object.values(data.tags);
        }

        // After parsing, check again if it's an object with numeric keys
        if (data.tags && typeof data.tags === 'object' && !Array.isArray(data.tags)) {
          data.tags = Object.values(data.tags);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setErrors([err instanceof Error ? err.message : 'Failed to fetch project']);
        setIsLoading(false);
      }
    };

    if (!isValidating && params.id) {
      fetchProject();
    }
  }, [isValidating, params.id]);

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerWidth < 600 ? 'vertical' : 'horizontal');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const steps = [
    'Název',
    'Popis',
    'Thumbnail',
    'Media',
    'Ukázka',
  ];

  const handleNext = () => {
    const stepErrors = validateStep(activeStep, projectData);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const finalErrors = validateProject(projectData);
      if (finalErrors.length > 0) {
        setErrors(finalErrors);
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      
      // Basic project info
      formData.append('name', projectData.name);
      formData.append('description', projectData.description);
      formData.append('tags', JSON.stringify(projectData.tags || []));
      
      // Thumbnail handling
      const thumbnailChanged = projectData.thumbnail !== null;
      formData.append('changedThumbnail', String(thumbnailChanged));
      if (projectData.thumbnail) {
        formData.append('thumbnail', projectData.thumbnail);
      }
      
      // Media handling - send only the paths of removed media
      const removedMediaPaths = (projectData.originalMedia || [])
        .filter(path => !(projectData.existingMedia || []).includes(path));
      formData.append('removedMedia', JSON.stringify(removedMediaPaths));

      // Add new media files
      if (projectData.media && projectData.media.length > 0) {
        projectData.media.forEach((file: File, index: number) => {
          formData.append(`addedMedia_${index}`, file);
        });
      }
      formData.append('addedMediaCount', String(projectData.media?.length || 0));

      const response = await fetch(`${config.apiUrl}/api/project/update?id=${params.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update project';
        try {
          const errorData = await response.text();
          console.log('Error response:', errorData);
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData);
              errorMessage = parsedError.message || errorMessage;
            } catch (parseError) {
              errorMessage = errorData;
            }
          }
        } catch (responseError) {
          console.error('Error reading response:', responseError);
        }
        throw new Error(errorMessage);
      }

      router.push('/my-projects');
    } catch (error: any) {
      console.error('Submit error:', error);
      setErrors([error.message || 'Failed to update project']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <ProjectInfo projectData={projectData} setProjectData={setProjectData} />;
      case 1:
        return <ProjectDescription projectData={projectData} setProjectData={setProjectData} />;
      case 2:
        return (
          <ProjectThumbnail 
            projectData={projectData} 
            setProjectData={setProjectData}
            existingThumbnail={projectData.existingThumbnail}
          />
        );
      case 3:
        return (
          <ProjectMedia 
            projectData={projectData} 
            setProjectData={setProjectData}
            existingMedia={projectData.existingMedia}
          />
        );
      case 4:
        return <ProjectPreview projectData={projectData} />;
      default:
        return 'Unknown step';
    }
  };

  if (isValidating || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <CircularProgress size="lg" />
      </div>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16">
        <Container className="py-8">
          <Container maxWidth="md">
            <Box className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <Stepper 
                component="div"
                orientation={orientation}
                sx={{
                  '--Stepper-verticalGap': '1rem',
                  '--Step-gap': '1rem',
                  marginBottom: 2
                }}
              >
                {steps.map((label, index) => (
                  <Step
                    key={label}
                    component="div"
                    indicator={
                      <StepIndicator
                        variant={index <= activeStep ? 'solid' : 'soft'}
                        color={index <= activeStep ? 'primary' : 'neutral'}
                      >
                        {index < activeStep ? <Check /> : index + 1}
                      </StepIndicator>
                    }
                  >
                    <StepButton
                      component="button"
                      onClick={() => setActiveStep(index)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'background.level1'
                        }
                      }}
                    >
                      {label}
                    </StepButton>
                  </Step>
                ))}
              </Stepper>

              <div>
                {getStepContent(activeStep)}
                <div className="mt-8 flex justify-between">
                  <Button
                    variant="outlined"
                    color="neutral"
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Zpět
                  </Button>
                  <div className="flex gap-2">
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="solid"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        endDecorator={isSubmitting && <CircularProgress size="sm" />}
                      >
                        {isSubmitting ? 'Ukládání...' : 'Uložit změny'}
                      </Button>
                    ) : (
                      <Button
                        variant="solid"
                        color="primary"
                        onClick={handleNext}
                      >
                        Další
                      </Button>
                    )}
                  </div>
                </div>
                {errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    {errors.map((error, index) => (
                      <p key={index} className="text-red-600">{error}</p>
                    ))}
                  </div>
                )}
              </div>
            </Box>
          </Container>
        </Container>
      </div>
    </>
  );
} 