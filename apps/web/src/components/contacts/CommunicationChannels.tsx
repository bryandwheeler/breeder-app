import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  MessageSquare,
  Instagram,
  Facebook,
  Send,
  MessageCircle,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { Customer } from '@breeder/types';
import { useNavigate } from 'react-router-dom';

interface CommunicationChannelsProps {
  customer: Customer;
  onEmailClick: () => void;
  onSmsClick?: () => void;
  compact?: boolean;
}

interface ChannelInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  value?: string;
  action?: () => void;
  actionLabel?: string;
  externalLink?: string;
  badge?: string;
}

export function CommunicationChannels({
  customer,
  onEmailClick,
  onSmsClick,
  compact = false,
}: CommunicationChannelsProps) {
  const navigate = useNavigate();

  const channels: ChannelInfo[] = [
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className='h-4 w-4' />,
      connected: !!customer.email,
      value: customer.email,
      action: onEmailClick,
      actionLabel: 'Send Email',
    },
    {
      id: 'phone',
      name: 'Phone',
      icon: <Phone className='h-4 w-4' />,
      connected: !!customer.phone,
      value: customer.phone,
      externalLink: customer.phone ? `tel:${customer.phone}` : undefined,
      actionLabel: 'Call',
    },
    {
      id: 'sms',
      name: 'Text Message',
      icon: <MessageCircle className='h-4 w-4' />,
      connected: !!customer.phone && customer.smsOptIn !== false,
      value: customer.smsPhoneNumber || customer.phone,
      action: onSmsClick,
      actionLabel: 'Send Text',
      badge: customer.smsEnabled ? 'Verified' : undefined,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className='h-4 w-4' />,
      connected: !!customer.instagramUsername || !!customer.instagramSenderId,
      value: customer.instagramUsername ? `@${customer.instagramUsername}` : undefined,
      action: customer.instagramSenderId
        ? () => navigate(`/messaging?contact=${customer.id}&channel=instagram`)
        : undefined,
      actionLabel: customer.instagramSenderId ? 'Message' : 'Connect',
      externalLink: customer.instagramUsername
        ? `https://instagram.com/${customer.instagramUsername}`
        : undefined,
      badge: customer.instagramSenderId ? 'Connected' : undefined,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className='h-4 w-4' />,
      connected: !!customer.facebook || !!customer.facebookUserId,
      value: customer.facebook ? 'Profile' : undefined,
      action: customer.facebookUserId
        ? () => navigate(`/messaging?contact=${customer.id}&channel=facebook`)
        : undefined,
      actionLabel: customer.facebookUserId ? 'Message' : 'View',
      externalLink: customer.facebook || customer.facebookProfileUrl,
      badge: customer.facebookUserId ? 'Connected' : undefined,
    },
  ];

  // Filter to only show connected channels in compact mode
  const displayChannels = compact
    ? channels.filter((ch) => ch.connected)
    : channels;

  if (compact) {
    return (
      <div className='flex flex-wrap gap-2'>
        {displayChannels.map((channel) => (
          <Button
            key={channel.id}
            variant='outline'
            size='sm'
            onClick={channel.action}
            asChild={!channel.action && !!channel.externalLink}
            className='gap-2'
          >
            {channel.action ? (
              <>
                {channel.icon}
                {channel.name}
              </>
            ) : channel.externalLink ? (
              <a href={channel.externalLink} target='_blank' rel='noopener noreferrer'>
                {channel.icon}
                {channel.name}
                <ExternalLink className='h-3 w-3 ml-1' />
              </a>
            ) : (
              <>
                {channel.icon}
                {channel.name}
              </>
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base flex items-center gap-2'>
          <MessageSquare className='h-4 w-4' />
          Communication Channels
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {displayChannels.map((channel) => (
          <div
            key={channel.id}
            className='flex items-center justify-between py-2 border-b last:border-0'
          >
            <div className='flex items-center gap-3'>
              <div
                className={`p-2 rounded-full ${
                  channel.connected
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {channel.icon}
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-sm'>{channel.name}</span>
                  {channel.badge && (
                    <Badge variant='outline' className='text-xs px-1.5 py-0'>
                      {channel.badge}
                    </Badge>
                  )}
                  {channel.connected ? (
                    <Check className='h-3 w-3 text-green-500' />
                  ) : (
                    <X className='h-3 w-3 text-muted-foreground' />
                  )}
                </div>
                {channel.value && (
                  <span className='text-xs text-muted-foreground'>{channel.value}</span>
                )}
              </div>
            </div>
            <div className='flex gap-1'>
              {channel.externalLink && (
                <Button variant='ghost' size='sm' asChild>
                  <a href={channel.externalLink} target='_blank' rel='noopener noreferrer'>
                    <ExternalLink className='h-4 w-4' />
                  </a>
                </Button>
              )}
              {channel.action && channel.connected && (
                <Button variant='ghost' size='sm' onClick={channel.action}>
                  <Send className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
