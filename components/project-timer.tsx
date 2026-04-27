"use client";

import { useState, useEffect, useRef } from 'react';
import { Project } from './dashboard';
import { useToast } from '@/lib/toast-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';

interface ProjectTimerProps {
  project: Project;
}

type TimerStage = 'scripting' | 'media' | 'review';

export function ProjectTimer({ project }: ProjectTimerProps) {
  const { showToast } = useToast();
  const [activeStage, setActiveStage] = useState<TimerStage>('scripting');
  const [isRunning, setIsRunning] = useState(false);
  const [times, setTimes] = useState({
    scripting: project.timerLogs?.scripting || 0,
    media: project.timerLogs?.media || 0,
    review: project.timerLogs?.review || 0,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [saving, setSaving] = useState(false);

  const stages: { id: TimerStage; label: string; color: string }[] = [
    { id: 'scripting', label: 'Scripting', color: 'bg-chart-1' },
    { id: 'media', label: 'Media', color: 'bg-chart-2' },
    { id: 'review', label: 'Review', color: 'bg-chart-3' },
  ];

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimes((prev) => ({
          ...prev,
          [activeStage]: prev[activeStage] + 1000,
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, activeStage]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStageChange = (stage: TimerStage) => {
    setActiveStage(stage);
  };

  const handleReset = () => {
    if (confirm('Reset timer for ' + activeStage + '?')) {
      setTimes((prev) => ({
        ...prev,
        [activeStage]: 0,
      }));
      setIsRunning(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        timerLogs: times,
        updatedAt: serverTimestamp(),
      });
      showToast('Timer saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving timer:', error);
      showToast('Failed to save timer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getTotalTime = () => {
    return times.scripting + times.media + times.review;
  };

  return (
    <div className="border-b border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Stage Selector */}
          <div className="flex gap-2">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => handleStageChange(stage.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeStage === stage.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                {stage.label}
                <span className="ml-1 font-mono text-xs opacity-70">
                  {formatTime(times[stage.id])}
                </span>
              </button>
            ))}
          </div>

          {/* Timer Display & Controls */}
          <div className="flex items-center gap-4">
            <div
              className={`rounded-lg bg-background px-6 py-3 font-mono text-2xl font-bold text-foreground ${
                isRunning ? 'timer-active' : ''
              }`}
            >
              {formatTime(times[activeStage])}
            </div>

            <div className="flex gap-2">
              <Button
                variant={isRunning ? 'destructive' : 'default'}
                onClick={() => setIsRunning(!isRunning)}
                className={!isRunning ? 'bg-success text-success-foreground hover:bg-success/90' : ''}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Total Time */}
        <div className="mt-3 text-sm text-muted-foreground">
          Total time spent: <span className="font-semibold text-foreground">{formatTime(getTotalTime())}</span>
        </div>
      </div>
    </div>
  );
}
