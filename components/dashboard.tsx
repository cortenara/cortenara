"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { ProjectView } from './project-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { 
  Video, 
  Plus, 
  FolderOpen, 
  Calendar, 
  LogOut, 
  Search,
  Trash2,
  Clock
} from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: { seconds: number } | null;
  updatedAt: { seconds: number } | null;
  userId: string;
  script: string;
  timerLogs: {
    scripting: number;
    media: number;
    review: number;
  };
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching projects:', error);
      showToast('Error loading projects', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, showToast]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    setCreating(true);
    try {
      await addDoc(collection(db, 'projects'), {
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid,
        script: '',
        timerLogs: {
          scripting: 0,
          media: 0,
          review: 0,
        },
      });
      showToast('Project created successfully!', 'success');
      setNewProjectName('');
      setNewProjectDesc('');
      setShowNewProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      showToast('Project deleted', 'success');
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project', 'error');
    }
  };

  const formatDate = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getTotalTime = (logs: Project['timerLogs']) => {
    return logs.scripting + logs.media + logs.review;
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show project detail view if a project is selected
  if (selectedProject) {
    return (
      <ProjectView 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Creator Workspace</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input pl-10"
            />
          </div>
          
          <Button
            onClick={() => setShowNewProject(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Project Name
                  </label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="bg-input"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Description
                  </label>
                  <Input
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Brief description (optional)"
                    className="bg-input"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewProject(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    {creating ? <Spinner className="h-5 w-5" /> : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
            <p className="mt-1 text-muted-foreground">
              Create your first project to get started
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && filteredProjects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                onClick={() => setSelectedProject(project)}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {/* Project icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>

                {/* Project info */}
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {project.name}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                  {project.description || 'No description'}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(project.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(getTotalTime(project.timerLogs))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No search results */}
        {!loading && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Search className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">No results found</h3>
            <p className="mt-1 text-muted-foreground">
              Try a different search term
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
