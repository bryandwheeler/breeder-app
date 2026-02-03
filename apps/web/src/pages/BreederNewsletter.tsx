/**
 * Breeder Newsletter Dashboard
 *
 * Main hub for managing the breeder's email marketing system.
 * Provides overview of subscribers, campaigns, sequences, and quick actions.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletterStore } from '@breeder/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Mail,
  Send,
  FileText,
  BarChart3,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Download,
  List,
  Settings,
  Loader2,
} from 'lucide-react';

export function BreederNewsletter() {
  const { currentUser } = useAuth();
  const {
    lists,
    campaigns,
    sequences,
    leadMagnets,
    signupForms,
    loading,
    subscribeLists,
    subscribeCampaigns,
    subscribeSequences,
    subscribeLeadMagnets,
    subscribeSignupForms,
  } = useNewsletterStore();

  // Subscribe to newsletter data with breeder ownerType
  useEffect(() => {
    if (!currentUser) return;

    const unsubLists = subscribeLists(currentUser.uid, 'breeder');
    const unsubCampaigns = subscribeCampaigns(currentUser.uid, 'breeder');
    const unsubSequences = subscribeSequences(currentUser.uid, 'breeder');
    const unsubLeadMagnets = subscribeLeadMagnets(currentUser.uid, 'breeder');
    const unsubSignupForms = subscribeSignupForms(currentUser.uid, 'breeder');

    return () => {
      unsubLists();
      unsubCampaigns();
      unsubSequences();
      unsubLeadMagnets();
      unsubSignupForms();
    };
  }, [currentUser, subscribeLists, subscribeCampaigns, subscribeSequences, subscribeLeadMagnets, subscribeSignupForms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading newsletter data...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSubscribers = lists.reduce((sum, list) => sum + list.subscriberCount, 0);
  const activeSubscribers = lists.reduce((sum, list) => sum + list.activeCount, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  const activeSequences = sequences.filter(s => s.status === 'active').length;

  // Recent campaigns
  const recentCampaigns = [...campaigns]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Newsletter</h1>
          <p className="text-muted-foreground">
            Manage your email marketing campaigns and subscribers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/newsletter/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link to="/newsletter/campaigns?new=true">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {activeSubscribers.toLocaleString()} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCampaigns} active, {sentCampaigns} sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autoresponders</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sequences.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeSequences} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Magnets</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadMagnets.length}</div>
            <p className="text-xs text-muted-foreground">
              {signupForms.length} signup forms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Campaigns</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/newsletter/campaigns">
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns yet</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link to="/newsletter/campaigns?new=true">
                        Create your first campaign
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCampaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {campaign.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <CampaignStatusBadge status={campaign.status} />
                          {campaign.status === 'sent' && campaign.stats && (
                            <span className="text-xs text-muted-foreground">
                              {campaign.stats.openRate.toFixed(1)}% opens
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lists Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Subscriber Lists</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/newsletter/lists">
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No subscriber lists yet</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link to="/newsletter/lists">
                        Create your first list
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lists.slice(0, 5).map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{list.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {list.subscriberCount.toLocaleString()} subscribers
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {list.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {list.doubleOptIn && (
                            <Badge variant="outline">Double Opt-in</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Sequences */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Autoresponders</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/newsletter/sequences">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sequences.filter(s => s.status === 'active').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active autoresponders</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/newsletter/sequences">
                      Create an autoresponder
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sequences
                    .filter(s => s.status === 'active')
                    .slice(0, 6)
                    .map((sequence) => (
                      <div
                        key={sequence.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{sequence.name}</h4>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {sequence.emailCount} emails in sequence
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{sequence.subscribersActive} active</span>
                          <span>{sequence.subscribersCompleted} completed</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              title="Create Campaign"
              description="Send a one-time email to your subscribers"
              icon={<Mail className="h-6 w-6" />}
              href="/newsletter/campaigns?new=true"
            />
            <QuickActionCard
              title="Manage Lists"
              description="Create and organize subscriber lists"
              icon={<List className="h-6 w-6" />}
              href="/newsletter/lists"
            />
            <QuickActionCard
              title="View Subscribers"
              description="Browse and manage your subscribers"
              icon={<Users className="h-6 w-6" />}
              href="/newsletter/subscribers"
            />
            <QuickActionCard
              title="Build Sequence"
              description="Create automated email sequences"
              icon={<Zap className="h-6 w-6" />}
              href="/newsletter/sequences"
            />
            <QuickActionCard
              title="Lead Magnets"
              description="Add downloadable resources"
              icon={<Download className="h-6 w-6" />}
              href="/newsletter/lead-magnets"
            />
            <QuickActionCard
              title="Signup Forms"
              description="Build embeddable opt-in forms"
              icon={<FileText className="h-6 w-6" />}
              href="/newsletter/forms"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Campaign status badge component
function CampaignStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    draft: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-800',
      icon: <FileText className="h-3 w-3" />,
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-800',
      icon: <Clock className="h-3 w-3" />,
    },
    sending: {
      label: 'Sending',
      className: 'bg-yellow-100 text-yellow-800',
      icon: <Send className="h-3 w-3" />,
    },
    sent: {
      label: 'Sent',
      className: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    paused: {
      label: 'Paused',
      className: 'bg-orange-100 text-orange-800',
      icon: <Clock className="h-3 w-3" />,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge className={config.className}>
      <span className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </span>
    </Badge>
  );
}

// Quick action card component
function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link to={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default BreederNewsletter;
