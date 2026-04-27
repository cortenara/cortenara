"use client";

import { useState } from 'react';
import { Project } from './dashboard';
import { ScriptingTab } from './tabs/scripting-tab';
import { MediaTab } from './tabs/media-tab';
import { AnalyticsTab } from './tabs/analytics-tab';
import { ProjectTimer } from './project-timer';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Image, 
  BarChart3,
  Timer
} from 'lucide-react';

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

type TabType = 'scripting' | 'media' | 'analytics';

export function ProjectView({ project, onBack }: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('scripting');
  const [showTimer, setShowTimer] = useState(false);

  const tabs = [
    { id: 'scripting' as const, label: 'Scripting & AI', icon: FileText },
    { id: 'media' as const, label: 'Media Assets', icon: Image },
    { id: 'analytics' as const, label: 'Video Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
                <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
              </div>
            </div>

            <Button
              variant={showTimer ? 'default' : 'outline'}
              onClick={() => setShowTimer(!showTimer)}
              className={showTimer ? 'bg-primary text-primary-foreground' : ''}
            >
              <Timer className="mr-2 h-4 w-4" />
              Timer
            </Button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Timer Panel */}
      {showTimer && (
        <ProjectTimer project={project} />
      )}

      {/* Tab Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {activeTab === 'scripting' && <ScriptingTab project={project} />}
        {activeTab === 'media' && <MediaTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>
    </div>
  );
}
