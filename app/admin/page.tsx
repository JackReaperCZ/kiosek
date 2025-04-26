'use client';

import { useState, useEffect } from 'react';
import { Box, CircularProgress, Container, Typography, Snackbar, Alert, Button } from '@mui/joy';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import NavigationBar from '../components/NavigationBar';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import { Input, Select, Option } from '@mui/joy';
import { config } from '../utils/config';

interface Project {
  id: string;
  name: string;
  thumbnail: string;
  status: string;
}

interface Tag {
  ID?: string;
  id?: string;
  Name?: string;
  name?: string;
  Added?: boolean;
  added?: boolean;
}

type ViewType = 'projects' | 'tags';

// Add this type near the top with other interfaces
type StatusFilter = 'all' | 'approved' | 'denied' | 'pending';

// Add this type near the top with other interfaces
type TagStatusFilter = 'all' | 'added' | 'pending';

export default function AdminPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();

  // Add state for the error toast
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Add these state variables with other useState declarations
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Add this state variable with other useState declarations
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Add this state variable with other useState declarations
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  // Add this state variable with other useState declarations
  const [tagStatusFilter, setTagStatusFilter] = useState<TagStatusFilter>('all');

  // Add loading states for actions
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});

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
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      setLoading(true);
      try {
        if (currentView === 'projects') {
          const response = await fetch(`${config.apiUrl}/api/check/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error('Failed to fetch projects');
          let data = await response.json();
          
          // Ensure data is an array
          if (!Array.isArray(data)) {
            console.error('Expected array but got:', data);
            // If data is not an array, try to convert it to an array
            if (data && typeof data === 'object') {
              // If it's an object, try to extract values
              const dataArray = Object.values(data);
              if (Array.isArray(dataArray) && dataArray.length > 0) {
                data = dataArray;
              } else {
                // If we can't extract a valid array, set empty projects
                setProjects([]);
                return;
              }
            } else {
              // Handle case for non-object/non-array data
              setProjects([]);
              return;
            }
          }
          
          // Now data is guaranteed to be an array
          const projectDetails = await Promise.all(
            data.map(async (projectId: any) => {
              // Convert to string if it's not already
              const id = String(projectId);
              const detailResponse = await fetch(`${config.apiUrl}/api/check/projects?id=${id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (!detailResponse.ok) throw new Error(`Failed to fetch project ${id}`);
              const projectData = await detailResponse.json();
              
              return {
                id,
                name: projectData.name || 'Unnamed Project',
                thumbnail: projectData.thumbnail || '',
                status: projectData.status || 'Waiting for checkup.'
              };
            })
          );
          setProjects(projectDetails);
        } else {
          const response = await fetch(`${config.apiUrl}/api/check/tags`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error('Failed to fetch tags');
          let data = await response.json();
          
          // Parse the JSON string if it's a string
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch (e) {
              console.error('Failed to parse tags JSON:', e);
              setTags([]);
              return;
            }
          }
          
          // Ensure we have an array
          if (!Array.isArray(data)) {
            console.error('Expected array of tags but got:', data);
            // If data is not an array, try to convert it
            if (data && typeof data === 'object') {
              // If it's an object, try to extract its values
              const tagsArray = Object.values(data);
              if (Array.isArray(tagsArray) && tagsArray.length > 0) {
                data = tagsArray;
              } else {
                setTags([]);
                return;
              }
            } else {
              setTags([]);
              return;
            }
          }
          
          // Process the tags to ensure they have the expected structure
          const processedTags = data.map((tag: any) => {
            // Ensure each tag has the required properties
            const tagId = tag.ID || tag.id || '';
            const tagName = tag.Name || tag.name || '';
            const isAdded = tag.Added !== undefined ? tag.Added : (tag.added !== undefined ? tag.added : false);
            
            return {
              ID: tagId,
              Name: tagName,
              Added: isAdded
            };
          });
          
          setTags(processedTags);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentView]);

  useEffect(() => {
    // Show toast when error is set
    if (error) {
      setShowErrorToast(true);
    }
  }, [error]);

  const handleProjectAction = async (projectId: string, action: 'approve' | 'deny') => {
    if (loadingActions[projectId]) return;

    try {
      setLoadingActions(prev => ({ ...prev, [projectId]: true }));
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.apiUrl}/api/check/projects/review?id=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved: action === 'approve' }),
      });

      if (!response.ok) throw new Error('Failed to update project');

      // Update the project status locally
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? { ...project, status: action === 'approve' ? 'Approved.' : 'Denied.' }
            : project
        )
      );

    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setLoadingActions(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleTagAction = async (tagId: string, approve: boolean) => {
    if (loadingActions[tagId]) return;

    try {
      setLoadingActions(prev => ({ ...prev, [tagId]: true }));
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${config.apiUrl}/api/check/tags/review?id=${tagId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved: approve }),
      });

      if (!response.ok) throw new Error('Failed to update tag');

      // Refresh tags after action using the same approach as fetchData
      await refreshTags(token);
    } catch (err) {
      console.error('Error updating tag:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tag');
    } finally {
      setLoadingActions(prev => ({ ...prev, [tagId]: false }));
    }
  };

  const handleTagDelete = async (tagId: string) => {
    if (loadingActions[tagId]) return;

    try {
      setLoadingActions(prev => ({ ...prev, [tagId]: true }));
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${config.apiUrl}/api/check/tags/review?id=${tagId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved: false }),
      });

      if (!response.ok) throw new Error('Failed to delete tag');

      // Refresh tags after action using the same approach as fetchData
      await refreshTags(token);
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setLoadingActions(prev => ({ ...prev, [tagId]: false }));
    }
  };

  // Add this helper function to refresh tags
  const refreshTags = async (token: string) => {
    try {
      const updatedTagsResponse = await fetch(`${config.apiUrl}/api/check/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!updatedTagsResponse.ok) throw new Error('Failed to fetch updated tags');
      let updatedData = await updatedTagsResponse.json();
      
      // Parse JSON if it's a string
      if (typeof updatedData === 'string') {
        try {
          updatedData = JSON.parse(updatedData);
        } catch (e) {
          console.error('Failed to parse tags JSON:', e);
          setTags([]);
          return;
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(updatedData)) {
        console.error('Expected array of tags but got:', updatedData);
        // If data is not an array, try to convert it
        if (updatedData && typeof updatedData === 'object') {
          // If it's an object, try to extract its values
          const tagsArray = Object.values(updatedData);
          if (Array.isArray(tagsArray) && tagsArray.length > 0) {
            updatedData = tagsArray;
          } else {
            setTags([]);
            return;
          }
        } else {
          setTags([]);
          return;
        }
      }
      
      // Process the tags to ensure they have the expected structure
      const processedTags = updatedData.map((tag: any) => {
        // Ensure each tag has the required properties
        const tagId = tag.ID || tag.id || '';
        const tagName = tag.Name || tag.name || '';
        const isAdded = tag.Added !== undefined ? tag.Added : (tag.added !== undefined ? tag.added : false);
        
        return {
          ID: tagId,
          Name: tagName,
          Added: isAdded
        };
      });
      
      setTags(processedTags);
    } catch (error) {
      console.error('Error refreshing tags:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh tags');
    }
  };

  // Update the filteredProjects function
  const filteredProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || 
       (statusFilter === 'approved' && project.status === 'Approved.') ||
       (statusFilter === 'denied' && project.status === 'Denied.') ||
       (statusFilter === 'pending' && project.status === 'Waiting for checkup.'))
    );

  // Update the filteredTags function
  const filteredTags = tags.filter(tag => {
    const tagName = tag.Name || tag.name || '';
    const isAdded = tag.Added !== undefined ? tag.Added : (tag.added !== undefined ? tag.added : false);
    
    return tagName.toLowerCase().includes(tagSearchTerm.toLowerCase()) &&
      (tagStatusFilter === 'all' || 
      (tagStatusFilter === 'added' && isAdded) ||
      (tagStatusFilter === 'pending' && !isAdded));
  });

  const renderProjects = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              startDecorator={<SearchIcon />}
              placeholder="Hledat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select
              placeholder="Seřadit podle data"
              value={sortOrder}
              onChange={(_, newValue) => {
                if (newValue) {
                  setSortOrder(newValue as 'newest' | 'oldest');
                }
              }}
              startDecorator={<SortIcon />}
              className="min-w-[150px]"
            >
              <Option value="newest">Od nejnovějšího</Option>
              <Option value="oldest">Od nejstaršího</Option>
            </Select>
            <Select
              placeholder="Filtrovat podle stavu"
              value={statusFilter}
              onChange={(_, newValue) => {
                if (newValue) {
                  setStatusFilter(newValue as StatusFilter);
                }
              }}
              className="min-w-[150px]"
            >
              <Option value="all">Všechny</Option>
              <Option value="approved">Schválené</Option>
              <Option value="denied">Zamítnuté</Option>
              <Option value="pending">Čekající</Option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Box
              key={project.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="relative group">
                <img
                  src={`${config.apiUrl}/` + project.thumbnail}
                  alt={project.name}
                  className="w-full h-48 object-cover"
                />

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => router.push(`/admin/check/${project.id}`)}
                      className="bg-blue-300 text-white px-4 py-2 rounded-lg mx-2"
                    >
                      Control
                    </button>
                  </div>
                </div>
              
              
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium
                  ${project.status === 'Approved.' ? 'bg-green-100 text-green-800' : 
                    project.status === 'Denied.' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {project.name}
                </h3>
              </div>
            </Box>
          ))}
        </div>
      </div>
    );
  };

  const renderTags = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              startDecorator={<SearchIcon />}
              placeholder="Hledat štítky..."
              value={tagSearchTerm}
              onChange={(e) => setTagSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select
              placeholder="Filtrovat podle stavu"
              value={tagStatusFilter}
              onChange={(_, newValue) => {
                if (newValue) {
                  setTagStatusFilter(newValue as TagStatusFilter);
                }
              }}
              className="min-w-[150px]"
            >
              <Option value="all">Všechny</Option>
              <Option value="added">Přidané</Option>
              <Option value="pending">Čekající</Option>
            </Select>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <Typography level="h4" className="text-gray-800">
                Správa štítků
              </Typography>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {filteredTags.length} štítků
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredTags.map((tag) => {
              const tagId = tag.ID || tag.id || "";
              const tagName = tag.Name || tag.name || "";
              const isAdded = tag.Added !== undefined ? tag.Added : (tag.added !== undefined ? tag.added : false);
              
              return (
                <div 
                  key={tagId}
                  className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <span className="text-lg font-medium text-gray-900">{tagName}</span>
                      <span className="text-sm text-gray-500">ID: {tagId}</span>
                    </div>
                    {isAdded ? (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Přidáno
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Čeká na schválení
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    {isAdded ? (
                      <Button
                        onClick={() => handleTagDelete(tagId)}
                        color="danger"
                        variant="soft"
                        size="sm"
                        disabled={loadingActions[tagId]}
                        endDecorator={loadingActions[tagId] && <CircularProgress size="sm" />}
                        className="transition-transform hover:scale-105"
                      >
                        {loadingActions[tagId] ? 'Mazání...' : 'Smazat'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleTagAction(tagId, true)}
                          color="success"
                          variant="soft"
                          size="sm"
                          disabled={loadingActions[tagId]}
                          endDecorator={loadingActions[tagId] && <CircularProgress size="sm" />}
                          className="transition-transform hover:scale-105"
                        >
                          {loadingActions[tagId] ? 'Schvalování...' : 'Schválit'}
                        </Button>
                        <Button
                          onClick={() => handleTagAction(tagId, false)}
                          color="danger"
                          variant="soft"
                          size="sm"
                          disabled={loadingActions[tagId]}
                          endDecorator={loadingActions[tagId] && <CircularProgress size="sm" />}
                          className="transition-transform hover:scale-105"
                        >
                          {loadingActions[tagId] ? 'Zamítání...' : 'Zamítnout'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredTags.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nebyly nalezeny žádné štítky
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
      <Container className="min-h-screen flex items-center justify-center">
        <CircularProgress size="lg" />
      </Container>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gray-50 flex pt-16">
        <Sidebar 
          isOpen={isMenuOpen} 
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
          onViewChange={setCurrentView}
          currentView={currentView}
        />
        
        <main className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-8">
            {currentView === 'projects' ? renderProjects() : renderTags()}
          </div>
        </main>

        {/* Error Toast */}
        <Snackbar
          open={showErrorToast}
          autoHideDuration={6000}
          onClose={() => {
            setShowErrorToast(false);
            setError(null);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          className="fixed bottom-4 right-4"
        >
          <Alert
            component="div"
            variant="soft"
            color="danger"
            size="lg"
          >
            {error}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
} 