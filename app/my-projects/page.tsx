'use client';

import { useState, useEffect } from 'react';
import { Box, Container, CircularProgress, Input, Chip, Select, Option, Button } from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/navigation';
import NavigationBar from '../components/NavigationBar';
import { config } from '../utils/config';

interface Project {
  id: string;
  name: string;
  thumbnailUrl: string;
  tags: string[];
  created: string;
  status?: string;
}

interface SelectValue {
  disabled?: boolean;
  label?: string;
  value: string;
  ref?: any;
  id?: string;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isValidating, setIsValidating] = useState(true);

  // Token validation
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
        router.push('/login');
      }
    };

    validateToken();
  }, [router]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${config.apiUrl}/api/preview/my-projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();

        // Extract and deduplicate all tags
        const allTags = new Set<string>();
        const processedProjects = data.map((project: any) => {
          // Check if Tags exists (from backend) and use it, otherwise fall back to tags or empty array
          let projectTags = project.Tags || project.tags || [];
          
          // Handle case where Tags is an object with numeric keys instead of an array
          if (projectTags && typeof projectTags === 'object' && !Array.isArray(projectTags)) {
            // Convert object like {0: "tag1", 1: "tag2"} to array ["tag1", "tag2"]
            projectTags = Object.values(projectTags);
          }
          // Ensure projectTags is an array
          else if (!Array.isArray(projectTags)) {
            // If it's a string, try to parse it as JSON
            if (typeof projectTags === 'string') {
              try {
                projectTags = JSON.parse(projectTags);
                // After parsing, check again if it's an object with numeric keys
                if (projectTags && typeof projectTags === 'object' && !Array.isArray(projectTags)) {
                  projectTags = Object.values(projectTags);
                }
              } catch (e) {
                console.error('Failed to parse tags:', e);
                projectTags = [];
              }
            } else {
              // If it's not an array or string or object, just use empty array
              projectTags = [];
            }
          }
          
          // Add tags to available tags set
          if (Array.isArray(projectTags)) {
            projectTags.forEach((tag: string) => allTags.add(tag));
          }
          
          // Also handle Created being an empty object
          const created = project.Created && Object.keys(project.Created).length === 0 
            ? new Date().toISOString() // Use current date if Created is empty object
            : project.Created || project.created || new Date().toISOString();
          
          return {
            id: project.ID || project.id,
            name: project.Name || project.name,
            thumbnailUrl: project.ThumbnailUrl || project.thumbnailUrl,
            tags: projectTags,
            created: created,
            status: project.status
          };
        });

        setProjects(processedProjects);
        setAvailableTags(Array.from(allTags));
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        setLoading(false);
      }
    };

    if (!isValidating) {
      fetchProjects();
    }
  }, [isValidating]);

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => project.tags.includes(tag));
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (isValidating || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <CircularProgress size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16">
        <Container className="py-8">
          <div className="space-y-8">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Input
                startDecorator={<SearchIcon />}
                placeholder="Hledat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow bg-white"
              />
              <div className="flex gap-2">
                <Select
                  value={sortOrder}
                  onChange={(_, value) => value && setSortOrder(value as 'newest' | 'oldest')}
                  startDecorator={<SortIcon />}
                >
                  <Option value="newest">Od nejnovějšího</Option>
                  <Option value="oldest">Od nejstaršího</Option>
                </Select>
                <Select
                  multiple
                  placeholder="Filtrovat podle štítků"
                  value={selectedTags}
                  onChange={(_, newValue: (string | { value: string })[]) => {
                    if (Array.isArray(newValue)) {
                      setSelectedTags(newValue.map(item => 
                        typeof item === 'string' ? item : item.value
                      ).filter(Boolean));
                    }
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {selected.map((selectedItem) => {
                        const chipValue = (typeof selectedItem === 'string' ? selectedItem : selectedItem.value).toString();
                        return (
                          <Chip key={chipValue} variant="soft" color="primary" size="sm">
                            {chipValue}
                          </Chip>
                        );
                      })}
                    </Box>
                  )}
                  className="min-w-[200px]"
                >
                  {availableTags.map((tag) => (
                    <Option key={tag} value={tag}>
                      {tag}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProjects.map((project) => (
                <Box
                  key={project.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden 
                    transition-all hover:shadow-xl hover:scale-[1.02] group relative"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={`${config.apiUrl}/${project.thumbnailUrl}`}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    {project.status && (
                      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium
                        ${project.status === 'Approved.' ? 'bg-green-100 text-green-800' : 
                          project.status === 'Denied.' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {project.status}
                      </div>
                    )}
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                      transition-opacity duration-200 flex items-center justify-center gap-3">
                      <Button
                        variant="solid"
                        color="neutral"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/edit/${project.id}`);
                        }}
                        startDecorator={<EditIcon />}
                        className="transition-transform hover:scale-105"
                      >
                        Upravit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {project.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          variant="soft"
                          color="primary"
                          size="sm"
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </Box>
              ))}
            </div>

            {filteredAndSortedProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Požná by to chtělo nějaké projekty 🤷.</p>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
} 