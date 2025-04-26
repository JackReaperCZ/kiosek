'use client';

import { useState, useEffect } from 'react';
import { Button, Typography } from '@mui/joy';
import { useRouter } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import UploadIcon from '@mui/icons-material/Upload';
import FolderIcon from '@mui/icons-material/Folder';
import { config } from '../utils/config';

export default function NavigationBar() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for name on component mount and window focus
    const checkAuth = () => {
      const name = localStorage.getItem('name');
      setUserName(name);
    };

    checkAuth();
    window.addEventListener('focus', checkAuth);
    
    return () => window.removeEventListener('focus', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src={ `${config.apiUrl}/uploads/SPSE-Jecna_Logotyp.svg`}
              alt="SPSE Jecna Logo"
              className="h-15 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            />
          </div>
          
          <div className="flex items-center gap-4">
            {userName ? (
              <>
                <Button
                  variant="soft"
                  color="primary"
                  onClick={() => router.push('/my-projects')}
                  startDecorator={<FolderIcon />}
                  className="transition-all hover:scale-105"
                >
                  Moje projekty
                </Button>
                <Button
                  variant="soft"
                  color="primary"
                  onClick={() => router.push('/upload')}
                  startDecorator={<UploadIcon />}
                  className="transition-all hover:scale-105"
                >
                  Nahrát
                </Button>
                <div className="flex items-center gap-2 ml-4">
                  <PersonIcon className="text-gray-600" />
                  <Typography level="body-sm" className="text-gray-600">
                    {userName}
                  </Typography>
                </div>
                <Button
                  variant="soft"
                  color="neutral"
                  onClick={handleLogout}
                  startDecorator={<LogoutIcon />}
                  className="transition-all hover:scale-105"
                >
                  Odhlásit se
                </Button>
              </>
            ) : (
              <Button
                variant="solid"
                color="primary"
                onClick={() => router.push('/login')}
                className="transition-all hover:scale-105"
              >
                Přihlásit se
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 