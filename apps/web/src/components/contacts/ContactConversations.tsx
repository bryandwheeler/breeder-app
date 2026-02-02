import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Mail,
  Phone,
  Instagram,
  Facebook,
  MessageCircle,
  ArrowUpRight,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Customer, Interaction } from '@breeder/types';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

interface ContactConversationsProps {
  customer: Customer;
  maxItems?: number;
}

type ChannelType = 'email' | 'phone' | 'text' | 'instagram_dm' | 'facebook_msg' | 'whatsapp' | 'other';

const channelConfig: Record<ChannelType, { icon: React.ReactNode; label: string; color: string }> = {
  email: { icon: <Mail className='h-4 w-4' />, label: 'Email', color: 'text-blue-500' },
  phone: { icon: <Phone className='h-4 w-4' />, label: 'Phone', color: 'text-green-500' },
  text: { icon: <MessageCircle className='h-4 w-4' />, label: 'Text', color: 'text-purple-500' },
  instagram_dm: { icon: <Instagram className='h-4 w-4' />, label: 'Instagram', color: 'text-pink-500' },
  facebook_msg: { icon: <Facebook className='h-4 w-4' />, label: 'Facebook', color: 'text-blue-600' },
  whatsapp: { icon: <MessageCircle className='h-4 w-4' />, label: 'WhatsApp', color: 'text-green-600' },
  other: { icon: <MessageSquare className='h-4 w-4' />, label: 'Other', color: 'text-gray-500' },
};

export function ContactConversations({
  customer,
  maxItems = 10,
}: ContactConversationsProps) {
  const navigate = useNavigate();

  // Get all communication-type interactions
  const communicationTypes: Interaction['type'][] = [
    'email',
    'phone',
    'text',
    'instagram_dm',
    'facebook_msg',
  ];

  const conversations = (customer.interactions || [])
    .filter((i) => communicationTypes.includes(i.type))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxItems);

  const getChannelInfo = (type: Interaction['type']) => {
    return channelConfig[type as ChannelType] || channelConfig.other;
  };

  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base flex items-center gap-2'>
            <MessageSquare className='h-4 w-4' />
            Recent Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-6 text-muted-foreground'>
            <MessageSquare className='h-10 w-10 mx-auto mb-3 opacity-30' />
            <p className='text-sm'>No communication history yet</p>
            <p className='text-xs mt-1'>
              Messages, calls, and emails will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3 flex flex-row items-center justify-between'>
        <CardTitle className='text-base flex items-center gap-2'>
          <MessageSquare className='h-4 w-4' />
          Recent Communications
        </CardTitle>
        {customer.conversationIds && customer.conversationIds.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate(`/messaging?contact=${customer.id}`)}
          >
            View All
            <ChevronRight className='ml-1 h-4 w-4' />
          </Button>
        )}
      </CardHeader>
      <CardContent className='p-0'>
        <ScrollArea className='max-h-[400px]'>
          <div className='divide-y'>
            {conversations.map((interaction) => {
              const channel = getChannelInfo(interaction.type);
              const isRecent =
                new Date().getTime() - new Date(interaction.date).getTime() <
                24 * 60 * 60 * 1000;

              return (
                <div
                  key={interaction.id}
                  className='flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors'
                >
                  <div className={`mt-0.5 ${channel.color}`}>{channel.icon}</div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm truncate'>
                        {interaction.subject || channel.label}
                      </span>
                      {interaction.direction && (
                        <Badge
                          variant='outline'
                          className={`text-xs ${
                            interaction.direction === 'inbound'
                              ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300'
                              : 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300'
                          }`}
                        >
                          {interaction.direction === 'inbound' ? 'Received' : 'Sent'}
                        </Badge>
                      )}
                    </div>
                    {interaction.notes && (
                      <p className='text-sm text-muted-foreground mt-0.5 line-clamp-2'>
                        {interaction.notes}
                      </p>
                    )}
                    <div className='flex items-center gap-1 mt-1 text-xs text-muted-foreground'>
                      <Clock className='h-3 w-3' />
                      {isRecent
                        ? formatDistanceToNow(new Date(interaction.date), {
                            addSuffix: true,
                          })
                        : format(new Date(interaction.date), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  {interaction.direction === 'outbound' && (
                    <ArrowUpRight className='h-4 w-4 text-muted-foreground' />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
