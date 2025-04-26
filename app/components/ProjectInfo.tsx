'use client';

import { Input, Autocomplete, FormControl, FormLabel, CircularProgress } from '@mui/joy';
import { useTags } from '../hooks/useTags';

interface ProjectInfoProps {
  projectData: any;
  setProjectData: (data: any) => void;
}

export default function ProjectInfo({ projectData, setProjectData }: ProjectInfoProps) {
  const { tags: availableTags, loading, error } = useTags();

  const handleTagsChange = (event: any, newValue: string[]) => {
    setProjectData({ ...projectData, tags: newValue });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 px-4">
      <FormControl>
        <FormLabel className="text-lg font-medium">Název projektu</FormLabel>
        <Input
          value={projectData.name}
          onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
          placeholder="Zadejte název projektu"
          className="mt-2"
          size="lg"
        />
      </FormControl>

      <FormControl>
        <FormLabel className="text-lg font-medium">Štítky
        </FormLabel>
        <Autocomplete
          multiple
          value={projectData.tags}
          onChange={handleTagsChange}
          options={availableTags || []}
          loading={loading}
          freeSolo
          placeholder="Přidat štítky"
          className="mt-2"
          size="lg"
          endDecorator={loading && <CircularProgress size="sm" />}
        />
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      </FormControl>
    </div>
  );
} 