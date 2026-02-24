import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Mail, Calendar, Shield } from 'lucide-react';
import { useThemePresets } from '@/contexts/theme-presets';
import { format } from 'date-fns';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';

export default function Profile() {
  const { user, logout } = useAuth();
  const { themeColors } = useThemePresets();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSaveProfile = async () => {
    // Here you would typically update the user profile
    // For now, we'll just close the editing mode
    setIsEditing(false);
    // TODO: Implement profile update with Firebase
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAccountAge = () => {
    if (user.metadata?.creationTime) {
      const createdAt = new Date(user.metadata.creationTime);
      const now = new Date();
      const diffInMonths = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      if (diffInMonths < 1) {
        return 'New member';
      } else if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} old`;
      } else {
        const years = Math.floor(diffInMonths / 12);
        return `${years} year${years > 1 ? 's' : ''} old`;
      }
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-8 w-8 p-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>Profile</h1>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Account Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture and Name */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl font-semibold text-white" style={{ backgroundColor: themeColors.primary }}>
                    {getInitials(user.displayName || user.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name…"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold">{user.displayName || 'No name set'}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {getAccountAge()}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Account Details */}
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input value={user.email || ''} disabled className="bg-muted" />
                    {user.emailVerified ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Account Created
                  </Label>
                  <Input
                    value={
                      user.metadata?.creationTime
                        ? format(new Date(user.metadata.creationTime), 'MMMM dd, yyyy')
                        : 'Unknown'
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Last Sign In
                  </Label>
                  <Input
                    value={
                      user.metadata?.lastSignInTime
                        ? format(new Date(user.metadata.lastSignInTime), 'MMMM dd, yyyy \'at\' h:mm a')
                        : 'Unknown'
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    User ID
                  </Label>
                  <Input
                    value={user.uid}
                    disabled
                    className="bg-muted font-mono text-xs"
                  />
                </div>
              </div>

              {isEditing && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button onClick={handleSaveProfile} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => navigate('/settings')}
              >
                <Shield className="h-4 w-4 mr-3" />
                Trading Settings & Preferences
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => navigate('/trades')}
              >
                <Calendar className="h-4 w-4 mr-3" />
                View Trading History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}