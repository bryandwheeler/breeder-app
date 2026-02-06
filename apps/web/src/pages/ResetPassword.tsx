import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError('');
      setSuccess(false);
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('No account found with this email address.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes and try again.');
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-3 sm:p-4'>
      <div className='w-full max-w-md space-y-6 sm:space-y-8'>
        <div className='text-center'>
          <h2 className='text-2xl sm:text-3xl font-bold'>Reset Password</h2>
          <p className='text-sm sm:text-base text-muted-foreground mt-2'>
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className='bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded'>
            {error}
          </div>
        )}

        {success && (
          <div className='bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded'>
            Password reset email sent! Check your inbox (and spam folder) for a link to reset your password.
          </div>
        )}

        {!success ? (
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
                autoFocus
              />
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <Button asChild className='w-full'>
            <Link to='/login'>Back to Sign In</Link>
          </Button>
        )}

        <div className='text-center text-sm'>
          <Link to='/login' className='text-muted-foreground hover:underline'>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
