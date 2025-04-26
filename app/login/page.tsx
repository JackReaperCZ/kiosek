'use client';

import { useState } from 'react';
import { Box, Button, Input, Typography, FormControl, FormLabel } from '@mui/joy';
import { useRouter } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { config } from '../utils/config';
interface LoginResponse {
  token: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json() as LoginResponse;
      
      // Save token and name to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('name', data.name);
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md mx-auto p-4">
        <Box
          component="form"
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 mt-8"
          sx={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
            <Typography level="h3" className="text-gray-800">
              Příhlásit se přes školní účet
            </Typography>
              <img 
                src={`${config.apiUrl}/uploads/SPSE-Jecna_Logotyp.svg`}
                alt="SPSE Jecna Logo"
                className="h-16 mt-5 hover:opacity-80 transition-opacity"
              />
            </div>
          </div>

          <div className="space-y-6">
            <FormControl>
              <FormLabel>Uživatel</FormLabel>
              <Input
                startDecorator={<PersonIcon />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Zadejte své uživatelské jméno"
                required
                className="bg-white"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Heslo</FormLabel>
              <Input
                startDecorator={<LockIcon />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Zadejte své heslo"
                type="password"
                required
                className="bg-white"
              />
            </FormControl>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-6"
              sx={{
                background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                '&:hover': {
                  background: 'linear-gradient(to right, #1d4ed8, #4338ca)',
                }
              }}
            >
              Přihlásit se
            </Button>
          </div>
        </Box>
      </div>
    </div>
  );
} 