'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, List, ListItem, Typography } from '@mui/joy';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onViewChange: (view: 'projects' | 'tags') => void;
  currentView: 'projects' | 'tags';
}

export default function Sidebar({ isOpen, onToggle, onViewChange, currentView }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <>
      {!isOpen && (
        <IconButton 
          onClick={onToggle}
          className="fixed top-20 left-4 z-50 bg-white shadow-lg"
        >
          <MenuIcon />
        </IconButton>
      )}
      
      <Box
        ref={sidebarRef}
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-xl transition-transform duration-300 z-40 w-64 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b">
          <Typography level="h4">Control Panel</Typography>
        </div>
        <List className="p-4">
          <ListItem 
            className={`mb-2 rounded-lg cursor-pointer ${currentView === 'projects' ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
            onClick={() => onViewChange('projects')}
          >
            <FolderIcon className="mr-3" />
            <Typography>Projecty</Typography>
          </ListItem>
          <ListItem 
            className={`mb-2 rounded-lg cursor-pointer ${currentView === 'tags' ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
            onClick={() => onViewChange('tags')}
          >
            <LocalOfferIcon className="mr-3" />
            <Typography>Štítky</Typography>
          </ListItem>
        </List>
      </Box>
    </>
  );
} 