export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  audioTranscript?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  progress: number;
  dueDate?: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  targetDate?: string;
  milestones?: string[];
  createdAt: Date;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'note';
  content?: string;
  parentId?: string;
  children?: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  files: ProjectFile[];
  createdAt: Date;
}