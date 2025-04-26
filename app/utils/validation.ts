interface ValidationRules {
  name: {
    minLength: number;
    maxLength: number;
  };
  tags: {
    minCount: number;
    maxCount: number;
    maxLength: number;
  };
  description: {
    minLength: number;
    maxLength: number;
  };
  thumbnail: {
    maxSize: number; // in bytes
    allowedTypes: string[];
  };
  media: {
    minCount: number;
    maxCount: number;
    maxSize: number; // in bytes
    allowedTypes: string[];
  };
}

const validationRules: ValidationRules = {
  name: {
    minLength: 3,
    maxLength: 100,
  },
  tags: {
    minCount: 1,
    maxCount: 5,
    maxLength: 20,
  },
  description: {
    minLength: 10,
    maxLength: 5000,
  },
  thumbnail: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
  media: {
    minCount: 1,
    maxCount: 10,
    maxSize: 50 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
  },
};

export function validateProject(projectData: any) {
  const errors: string[] = [];

  // Validate name
  if (!projectData.name || projectData.name.length < validationRules.name.minLength) {
    errors.push(`Název projektu musí mít minimálně ${validationRules.name.minLength} znaky`);
  }
  if (projectData.name.length > validationRules.name.maxLength) {
    errors.push(`Název projektu nesmí být delší než ${validationRules.name.maxLength} znaků`);
  }

  // Validate tags
  if (!projectData.tags || projectData.tags.length < validationRules.tags.minCount) {
    errors.push(`Nejméně ${validationRules.tags.minCount} štítek je povinný`);
  }
  if (projectData.tags.length > validationRules.tags.maxCount) {
    errors.push(`Není povoleno více než ${validationRules.tags.maxCount} štítků`);
  }
  projectData.tags.forEach((tag: string) => {
    if (tag.length > validationRules.tags.maxLength) {
      errors.push(`Štítek "${tag}" přesahuje maximální délku: ${validationRules.tags.maxLength} znaků`);
    }
  });

  // Validate description
  if (!projectData.description || projectData.description.length < validationRules.description.minLength) {
    errors.push(`Popis musí mít minimálně ${validationRules.description.minLength} znaků`);
  }
  if (projectData.description.length > validationRules.description.maxLength) {
    errors.push(`Popis nesmí být delší než ${validationRules.description.maxLength} znaků`);
  }

  // Validate thumbnail
  if (!projectData.thumbnail && !projectData.existingThumbnail) {
    errors.push('Náhledový obrázek je povinný');
  } else if (projectData.thumbnail) {
    if (!validationRules.thumbnail.allowedTypes.includes(projectData.thumbnail.type)) {
      errors.push('Neplatný formát náhledového obrázku');
    }
    if (projectData.thumbnail.size > validationRules.thumbnail.maxSize) {
      errors.push(`Velikost náhledového obrázku nesmí přesáhnout ${validationRules.thumbnail.maxSize / (1024 * 1024)}MB`);
    }
  }

  // Validate media
  const totalMediaCount = (projectData.media?.length || 0) + (projectData.existingMedia?.length || 0);
  if (totalMediaCount < validationRules.media.minCount) {
    errors.push(`Je vyžadován alespoň ${validationRules.media.minCount} mediální soubor`);
  }
  if (totalMediaCount > validationRules.media.maxCount) {
    errors.push(`Nelze přesáhnout ${validationRules.media.maxCount} mediálních souborů`);
  }
  
  // Validate new media files
  projectData.media?.forEach((file: File) => {
    if (!validationRules.media.allowedTypes.includes(file.type)) {
      errors.push(`Neplatný formát mediálního souboru: ${file.type}`);
    }
    if (file.size > validationRules.media.maxSize) {
      errors.push(`Velikost mediálního souboru nesmí přesáhnout ${validationRules.media.maxSize / (1024 * 1024)}MB`);
    }
  });

  return errors;
}

export function validateStep(step: number, projectData: any) {
  const errors: string[] = [];

  switch (step) {
    case 0: // Project Info
      if (!projectData.name || projectData.name.length < validationRules.name.minLength) {
        errors.push(`Název projektu musí mít minimálně ${validationRules.name.minLength} znaky`);
      }
      if (projectData.name.length > validationRules.name.maxLength) {
        errors.push(`Název projektu nesmí být delší než ${validationRules.name.maxLength} znaků`);
      }
      if (!projectData.tags || projectData.tags.length < validationRules.tags.minCount) {
        errors.push(`Nejméně ${validationRules.tags.minCount} štítek je povinný`);
      }
      if (projectData.tags.length > validationRules.tags.maxCount) {
        errors.push(`Není povoleno více než ${validationRules.tags.maxCount} štítků`);
      }
      break;

    case 1: // Description
      if (!projectData.description || projectData.description.length < validationRules.description.minLength) {
        errors.push(`Popis musí mít minimálně ${validationRules.description.minLength} znaků`);
      }
      if (projectData.description.length > validationRules.description.maxLength) {
        errors.push(`Popis nesmí být delší než ${validationRules.description.maxLength} znaků`);
      }
      break;

    case 2: // Thumbnail
      if (!projectData.thumbnail && !projectData.existingThumbnail) {
        errors.push('Náhledový obrázek je povinný');
      } else if (projectData.thumbnail) {
        if (!validationRules.thumbnail.allowedTypes.includes(projectData.thumbnail.type)) {
          errors.push(`Neplatný formát náhledového obrázku: ${projectData.thumbnail.type}`);
        }
        if (projectData.thumbnail.size > validationRules.thumbnail.maxSize) {
          errors.push(`Velikost náhledového obrázku nesmí přesáhnout ${validationRules.thumbnail.maxSize / (1024 * 1024)}MB`);
        }
      }
      break;

    case 3: // Media
      const totalMediaCount = (projectData.media?.length || 0) + (projectData.existingMedia?.length || 0);
      if (totalMediaCount < validationRules.media.minCount) {
        errors.push(`Je vyžadován alespoň ${validationRules.media.minCount} mediální soubor`);
      }
      if (totalMediaCount > validationRules.media.maxCount) {
        errors.push(`Nelze přesáhnout ${validationRules.media.maxCount} mediálních souborů`);
      }
      projectData.media?.forEach((file: File) => {
        if (!validationRules.media.allowedTypes.includes(file.type)) {
          errors.push(`Neplatný formát mediálního souboru: ${file.type}`);
        }
        if (file.size > validationRules.media.maxSize) {
          errors.push(`Velikost mediálního souboru nesmí přesáhnout ${validationRules.media.maxSize / (1024 * 1024)}MB`);
        }
      });
      break;
  }

  return errors;
}

export { validationRules }; 