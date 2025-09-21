import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Heart, 
  Users as Hug, 
  Zap, 
  Rainbow, 
  Search, 
  Filter,
  Plus,
  AlertTriangle,
  Phone,
  Calendar,
  Users,
  BookOpen,
  Briefcase,
  Home,
  Heart as HeartIcon,
  DollarSign,
  Brain
} from 'lucide-react';
import { getStoredUser, AnonymousUser } from '@/components/AnonymousIdentity';
import { moderateContent, generateCrisisResponse } from '@/components/ContentModeration';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: AnonymousUser;
  createdAt: string;
  replies: ForumReply[];
  reactions: {
    support: number;
    hug: number;
    strength: number;
    hope: number;
  };
  isHelpful?: boolean;
  isCrisis?: boolean;
  moderationStatus: 'approved' | 'pending' | 'rejected';
}

interface ForumReply {
  id: string;
  content: string;
  author: AnonymousUser;
  createdAt: string;
  parentId?: string;
  reactions: {
    support: number;
    hug: number;
    strength: number;
    hope: number;
  };
  isHelpful?: boolean;
  moderationStatus: 'approved' | 'pending' | 'rejected';
}

const categories = [
  { id: 'academic', name: 'Academic Pressure', icon: BookOpen, emoji: '📚', color: 'bg-blue-100 text-blue-800' },
  { id: 'career', name: 'Career Anxiety', icon: Briefcase, emoji: '💼', color: 'bg-green-100 text-green-800' },
  { id: 'family', name: 'Family Expectations', icon: Home, emoji: '👨‍👩‍👧‍👦', color: 'bg-purple-100 text-purple-800' },
  { id: 'relationships', name: 'Relationship Issues', icon: HeartIcon, emoji: '💕', color: 'bg-pink-100 text-pink-800' },
  { id: 'financial', name: 'Financial Stress', icon: DollarSign, emoji: '💰', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'mental-health', name: 'Mental Health Support', icon: Brain, emoji: '🧠', color: 'bg-red-100 text-red-800' },
  { id: 'campus', name: 'Campus Life', icon: Users, emoji: '🎓', color: 'bg-indigo-100 text-indigo-800' }
];

const PeerSupportForum: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AnonymousUser | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'academic' });
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newReply, setNewReply] = useState('');
  const [crisisDialog, setCrisisDialog] = useState<any>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      // Redirect to entry page if no user data
      window.location.href = '/peer-support';
      return;
    }
    setCurrentUser(user);
    loadSamplePosts();
  }, []);

  const loadSamplePosts = () => {
    // Sample posts for demonstration
    const samplePosts: ForumPost[] = [
      {
        id: '1',
        title: 'Feeling overwhelmed with final exams',
        content: 'I have 5 exams next week and I feel like I can\'t handle the pressure. Anyone else feeling this way?',
        category: 'academic',
        author: {
          id: 'user1',
          displayName: 'SupportiveListener47',
          avatar: { emoji: '🌟', color: 'bg-blue-100 text-blue-800' },
          type: 'anonymous',
          joinedAt: new Date().toISOString()
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        replies: [],
        reactions: { support: 12, hug: 8, strength: 5, hope: 3 },
        moderationStatus: 'approved'
      },
      {
        id: '2',
        title: 'Placement anxiety is killing me',
        content: 'All my friends are getting placed but I haven\'t even got a single interview call. Feeling like a failure.',
        category: 'career',
        author: {
          id: 'user2',
          displayName: 'Student from IIT Delhi',
          avatar: { emoji: '💙', color: 'bg-green-100 text-green-800' },
          type: 'campus',
          collegeName: 'IIT Delhi',
          joinedAt: new Date().toISOString()
        },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        replies: [],
        reactions: { support: 15, hug: 10, strength: 7, hope: 4 },
        moderationStatus: 'approved'
      }
    ];
    setPosts(samplePosts);
  };

  const handleNewPost = async () => {
    if (!currentUser || !newPost.title.trim() || !newPost.content.trim()) return;

    // Moderate content
    const moderation = await moderateContent(newPost.content);
    
    if (moderation.crisisDetected) {
      setCrisisDialog(generateCrisisResponse(currentUser.displayName));
      return;
    }

    const post: ForumPost = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      author: currentUser,
      createdAt: new Date().toISOString(),
      replies: [],
      reactions: { support: 0, hug: 0, strength: 0, hope: 0 },
      moderationStatus: moderation.isApproved ? 'approved' : 'pending'
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({ title: '', content: '', category: 'academic' });
    setShowNewPost(false);
  };

  const handleReply = async (postId: string) => {
    if (!currentUser || !newReply.trim()) return;

    // Moderate content
    const moderation = await moderateContent(newReply);
    
    if (moderation.crisisDetected) {
      setCrisisDialog(generateCrisisResponse(currentUser.displayName));
      return;
    }

    const reply: ForumReply = {
      id: Date.now().toString(),
      content: newReply,
      author: currentUser,
      createdAt: new Date().toISOString(),
      reactions: { support: 0, hug: 0, strength: 0, hope: 0 },
      moderationStatus: moderation.isApproved ? 'approved' : 'pending'
    };

    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, replies: [...post.replies, reply] }
        : post
    ));
    setNewReply('');
  };

  const addReaction = (postId: string, reaction: keyof ForumPost['reactions']) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, reactions: { ...post.reactions, [reaction]: post.reactions[reaction] + 1 } }
        : post
    ));
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && post.moderationStatus === 'approved';
  });

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Peer Support Forum</h1>
              <p className="text-muted-foreground">
                Welcome, {currentUser.displayName} {currentUser.avatar.emoji}
              </p>
            </div>
            <Button onClick={() => setShowNewPost(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Topics
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="mr-2">{category.emoji}</span>
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${categories.find(c => c.id === post.category)?.color}`}>
                            {categories.find(c => c.id === post.category)?.emoji} {categories.find(c => c.id === post.category)?.name}
                          </span>
                          <span>•</span>
                          <span>{post.author.displayName} {post.author.avatar.emoji}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{post.content}</p>
                    
                    {/* Reactions */}
                    <div className="flex items-center gap-4 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(post.id, 'support')}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {post.reactions.support}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(post.id, 'hug')}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Hug className="h-4 w-4 mr-1" />
                        {post.reactions.hug}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(post.id, 'strength')}
                        className="text-green-500 hover:text-green-600"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        {post.reactions.strength}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(post.id, 'hope')}
                        className="text-purple-500 hover:text-purple-600"
                      >
                        <Rainbow className="h-4 w-4 mr-1" />
                        {post.reactions.hope}
                      </Button>
                    </div>

                    {/* Replies */}
                    {post.replies.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Replies ({post.replies.length})</h4>
                        <div className="space-y-3">
                          {post.replies.map(reply => (
                            <div key={reply.id} className="bg-muted/50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">{reply.author.displayName} {reply.author.avatar.emoji}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply Form */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Share your thoughts and support..."
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <Button onClick={() => handleReply(post.id)} disabled={!newReply.trim()}>
                          Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts and get support from the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="What's on your mind?"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full p-2 border rounded-md"
                value={newPost.category}
                onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Share your experience, ask for advice, or offer support..."
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewPost(false)}>
                Cancel
              </Button>
              <Button onClick={handleNewPost} disabled={!newPost.title.trim() || !newPost.content.trim()}>
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crisis Dialog */}
      <Dialog open={!!crisisDialog} onOpenChange={() => setCrisisDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {crisisDialog?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">{crisisDialog?.message}</p>
            
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>
                <strong>KIRAN Mental Health Helpline: 1800-599-0019</strong>
                <br />
                Available 24/7
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">Immediate Actions:</h4>
              <ul className="text-sm space-y-1">
                {crisisDialog?.actions.map((action: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setCrisisDialog(null)}>
                I Understand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeerSupportForum;
