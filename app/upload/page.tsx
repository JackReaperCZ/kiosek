'use client';

import { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepButton, StepIndicator, Button, Container, CircularProgress } from '@mui/joy';
import { useRouter } from 'next/navigation';
import Check from '@mui/icons-material/Check';
import ProjectInfo from '../components/ProjectInfo';
import ProjectDescription from '../components/ProjectDescription';
import ProjectThumbnail from '../components/ProjectThumbnail';
import ProjectMedia from '../components/ProjectMedia';
import ProjectPreview from '../components/ProjectPreview';
import { validateProject, validateStep } from '../utils/validation'
import NavigationBar from '../components/NavigationBar';
import { config } from '../utils/config';

interface ProjectData {
  name: string;
  tags: string[];
  description: string;
  thumbnail: File | null;
  media: File[];
}

export default function UploadProject() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    tags: [],
    description: '',
    thumbnail: null,
    media: []
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${config.apiUrl}/api/auth/validate`, {
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
        localStorage.removeItem('token');
        localStorage.removeItem('name');
        router.push('/login');
      }
    };

    validateToken();
  }, [router]);

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerWidth < 600 ? 'vertical' : 'horizontal');
    };
    
    handleResize(); // Set initial orientation
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
      // Create FormData object to handle file uploads
      const formData = new FormData();
      
      // Add basic data
      formData.append('name', projectData.name);
      formData.append('description', projectData.description);
      formData.append('tags', JSON.stringify(projectData.tags));
      if (projectData.thumbnail) {
        formData.append('thumbnail', projectData.thumbnail);
      }
      
      // Add media files
      projectData.media.forEach((file: File, index: number) => {
        formData.append(`media_${index}`, file);
      });

      // Make POST request
      const response = await fetch(`${config.apiUrl}/api/project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit project');
      }
  
      const result = await response.json();
      console.log('Project submitted successfully:', result);
      
      // Move to completion step
      setActiveStep((prevStep) => prevStep + 1);
      router.push('/my-projects');
  
    } catch (error: any) {
      setErrors([error.message || 'Failed to submit project']);
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
        return <ProjectThumbnail projectData={projectData} setProjectData={setProjectData} />;
      case 3:
        return <ProjectMedia projectData={projectData} setProjectData={setProjectData} />;
      case 4:
        return <ProjectPreview projectData={projectData} />;
      default:
        return 'Unknown step';
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <CircularProgress size="lg" />
      </div>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="pt-16">
        <Container 
          maxWidth={false} 
          disableGutters 
          className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col"
        >
          <Container 
            maxWidth="lg" 
            className="py-8 px-4 flex-grow flex flex-col justify-center"
          >
            <Box 
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 md:p-8 mx-auto w-full"
              sx={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Stepper
                orientation={orientation}
                sx={{ 
                  width: '100%',
                  mb: 4,
                  '& .MuiStepButton-root': {
                    cursor: 'default'
                  },
                  '@media (max-width: 640px)': {
                    '& .MuiStep-root': {
                      padding: '8px 0',
                    },
                    '& .MuiStepConnector-line': {
                      minHeight: '24px'
                    }
                  }
                }}
              >
                {steps.map((step, index) => (
                  <Step
                    key={step}
                    indicator={
                      <StepIndicator
                        variant={activeStep <= index ? 'soft' : 'solid'}
                        color={activeStep < index ? 'neutral' : 'primary'}
                      >
                        {activeStep <= index ? index + 1 : <Check />}
                      </StepIndicator>
                    }
                    sx={[
                      activeStep > index && index !== steps.length - 1 && {
                        '&::after': { bgcolor: 'primary.solidBg' }
                      },
                    ]}
                  >
                    <StepButton>{step}</StepButton>
                  </Step>
                ))}
              </Stepper>

              <div className="mt-8">
                {activeStep === steps.length ? (
                  <div className="text-center py-12">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                      All steps completed - your project is being submitted
                    </h2>
                  </div>
                ) : (
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
                            {isSubmitting ? 'Odesílání...' : 'Odeslat'}
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
                )}
              </div>
            </Box>
          </Container>
        </Container>
      </div>
    </>
  );
} 