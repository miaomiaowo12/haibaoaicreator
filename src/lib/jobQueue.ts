import { getStore } from '@netlify/blobs';

interface Job {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
}

// Get the job store from Netlify Blobs
function getJobStore() {
  return getStore('job-queue');
}

export async function createJob(): Promise<string> {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const store = getJobStore();
  
  await store.setJSON(jobId, {
    status: 'pending',
    createdAt: Date.now(),
  });
  
  return jobId;
}

export async function updateJob(
  jobId: string, 
  status: 'processing' | 'completed' | 'failed', 
  data?: any, 
  error?: string
): Promise<void> {
  const store = getJobStore();
  
  const job: Job = {
    status,
    createdAt: Date.now(),
  };
  
  if (data) job.result = data;
  if (error) job.error = error;
  
  await store.setJSON(jobId, job);
}

export async function getJob(jobId: string): Promise<Job | null> {
  const store = getJobStore();
  
  try {
    const job = await store.get(jobId, { type: 'json' });
    return job as Job;
  } catch {
    return null;
  }
}

// Clean up old jobs (optional, can be called periodically)
export async function cleanupOldJobs(): Promise<void> {
  // Netlify Blobs automatically manages storage
  // This function is kept for API compatibility
  console.log('Cleanup: Netlify Blobs manages storage automatically');
}
