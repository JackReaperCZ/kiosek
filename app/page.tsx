'use client';

import { useState, useEffect } from 'react';
import { Box, Container, CircularProgress, Input, Chip, Select, Option } from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import NavigationBar from './components/NavigationBar';
import { config } from './utils/config';

interface Project {
  id: string;
  name: string;
  thumbnailUrl: string;
  tags: string[];
  created: string;
  status?: string;
}

interface ApiProject {
  id?: string;
  ID?: string;
  name?: string;
  Name?: string;
  thumbnailUrl?: string;
  ThumbnailUrl?: string;
  tags?: string[];
  Tags?: string[];
  created?: string;
  Created?: string;
  status?: string;
}

interface SelectValue {
  disabled?: boolean;
  label?: string;
  value: string;
  ref?: any;
  id?: string;
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/preview/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();

        // Extract and deduplicate all tags
        const allTags = new Set<string>();
        const processedProjects = data.map((project: ApiProject) => {
          // Handle both uppercase and lowercase properties
          const projectTags = project.Tags || project.tags || [];
          
          projectTags.forEach((tag: string) => allTags.add(tag));
          
          return {
            id: project.ID || project.id || '',
            name: project.Name || project.name || '',
            thumbnailUrl: project.ThumbnailUrl || project.thumbnailUrl || '',
            tags: projectTags,
            created: project.Created || project.created || ''
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

    fetchProjects();
  }, []);

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

  if (loading) {
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
                  placeholder="Sort by date"
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
                  multiple
                  placeholder="Filtr podle štítků"
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
                          <Chip
                            key={chipValue}
                            variant="soft"
                            color="primary"
                            size="sm"
                          >
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
                    transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                  onClick={() => window.location.href = `/project/${project.id}`}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={`${config.apiUrl}/${project.thumbnailUrl}`}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
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
                <p className="text-gray-500">Je to tady celkem prázdné 🤷.</p>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
}
