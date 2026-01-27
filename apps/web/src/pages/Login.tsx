import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, loginWithFacebook, currentUser } = useAuth();
  const navigate = useNavigate();

  // Fallback effect for browsers where Navigate component doesn't work (iOS Chrome)
  useEffect(() => {
    if (currentUser) {
      console.log('[Login] User authenticated, attempting redirect to home');
      // Use window.location as ultimate fallback for problematic browsers
      // Try immediately, then again after a short delay
      if (window.location.pathname === '/login') {
        window.location.replace('/');
      }
      const timer = setTimeout(() => {
        if (window.location.pathname === '/login') {
          console.log('[Login] Still on login page after 200ms, forcing redirect');
          window.location.href = '/';
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // If already logged in, redirect immediately
  if (currentUser) {
    console.log('[Login] Rendering Navigate component to redirect');
    return <Navigate to='/' replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      // Provide helpful error messages
      const errorCode = err?.code;
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
        setError('No account found with this email. Please sign up first.');
      } else if (errorCode === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to log in');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebookLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithFacebook();
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Facebook');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-3 sm:p-4'>
      <div className='w-full max-w-md space-y-6 sm:space-y-8'>
        <div className='text-center'>
          <h2 className='text-2xl sm:text-3xl font-bold'>
            Doodle Bliss Kennel
          </h2>
          <p className='text-sm sm:text-base text-muted-foreground mt-2'>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className='bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder='your@email.com'
              className='mt-1'
            />
          </div>

          <div>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder='••••••••'
              className='mt-1'
            />
          </div>

          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className='relative my-6'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-white dark:bg-gray-950 px-4 text-muted-foreground'>
              Or continue with
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={handleGoogleLogin}
            disabled={loading}
            className='hover:bg-gray-50 dark:hover:bg-gray-900'
          >
            <svg className='mr-2 h-5 w-5' viewBox='0 0 24 24'>
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Google
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={handleFacebookLogin}
            disabled={loading}
            className='hover:bg-gray-50 dark:hover:bg-gray-900'
          >
            <svg
              className='mr-2 h-5 w-5'
              viewBox='0 0 24 24'
            >
              <path
                fill='#1877F2'
                d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
              />
            </svg>
            Facebook
          </Button>
        </div>

        <div className='text-center text-sm'>
          <span className='text-muted-foreground'>Don't have an account? </span>
          <Link to='/signup' className='text-primary hover:underline'>
            Sign up
          </Link>
        </div>

        <div className='text-center text-sm'>
          <Link
            to='/reset-password'
            className='text-muted-foreground hover:underline'
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
