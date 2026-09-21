export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  ownerId: string;
  ownerEmail?: string;
  sharedWith?: Pick<User, 'id' | 'email' | 'displayName'>[];
  createdAt: string;
  updatedAt: string;
}

export type TaskFilter = 'all' | 'mine' | 'shared';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface ShareTaskInput {
  email: string;
}
