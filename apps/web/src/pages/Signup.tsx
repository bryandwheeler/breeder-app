import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chrome, Facebook } from 'lucide-react';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle, loginWithFacebook, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebookLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithFacebook();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Facebook');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold'>Create Account</h2>
          <p className='text-muted-foreground mt-2'>
            Sign up for Doodle Bliss Kennel
          </p>
        </div>

        {error && (
          <div className='bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <Label htmlFor='displayName'>Name</Label>
            <Input
              id='displayName'
              type='text'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder='John Doe'
              className='mt-1'
            />
          </div>

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

          <div>
            <Label htmlFor='confirmPassword'>Confirm Password</Label>
            <Input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder='••••••••'
              className='mt-1'
            />
          </div>

          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='relative z-10 bg-background px-2 text-muted-foreground'>
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
          >
            <Chrome className='mr-2 h-4 w-4' />
            Google
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={handleFacebookLogin}
            disabled={loading}
          >
            <Facebook className='mr-2 h-4 w-4' />
            Facebook
          </Button>
        </div>

        <div className='text-center text-sm'>
          <span className='text-muted-foreground'>
            Already have an account?{' '}
          </span>
          <Link to='/login' className='text-primary hover:underline'>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
