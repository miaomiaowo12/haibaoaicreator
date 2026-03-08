// 简单的内存任务队列（生产环境应该用 Redis）
const jobs = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
}>();

// 清理旧任务（30分钟前）
const cleanupOldJobs = () => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > thirtyMinutes) {
      jobs.delete(jobId);
    }
  }
};

// 每5分钟清理一次
setInterval(cleanupOldJobs, 5 * 60 * 1000);

export function createJob(): string {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  jobs.set(jobId, {
    status: 'pending',
    createdAt: Date.now(),
  });
  return jobId;
}

export function updateJob(jobId: string, status: 'processing' | 'completed' | 'failed', data?: any, error?: string) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    if (data) job.result = data;
    if (error) job.error = error;
  }
}

export function getJob(jobId: string) {
  return jobs.get(jobId);
}
