// disable strict TLS verification if you have self-signed certs in cluster (use with caution)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import cors from 'cors';
import { Writable } from 'stream';
import promClient from 'prom-client';
import { KubeConfig, CoreV1Api, Exec } from '@kubernetes/client-node';
import { DOMAIN } from './config';
import { prisma } from 'db/client';

/**
 * Simplified, logged, and annotated Kubernetes worker server.
 *
 * - Preserves original behavior: creates a Pod with 3 containers, creates 3 Services,
 *   execs `mv` to move files inside the code-server container, waits for Pod readiness.
 * - Adds explanatory logs (English).
 * - Ensures namespace exists before creating resources.
 * - Graceful error handling and clearer function boundaries.
 */

/* ----------------------------- Constants ----------------------------- */

// Namespace used to host per-user project pods & services
const NAMESPACE = 'user-apps';

// Prometheus histogram: measures assignPod time (seconds)
const containerCreateBucket = new promClient.Histogram({
  name: 'container_create_bucket',
  help: 'Time taken (seconds) to assign project to a pod (create/ready/assign).',
  labelNames: ['type'],
  // buckets in seconds (small -> large)
  buckets: [0.5, 1, 2.5, 5, 10, 25, 50, 100, 200],
});

const PROJECT_TYPE_TO_BASE_FOLDER: Record<string, string> = {
  NEXTJS: '/tmp/next-app',
  REACT: '/tmp/react-app',
  REACT_NATIVE: '/tmp/mobile-app',
};

/* ----------------------------- Setup ----------------------------- */

const app = express();
app.use(cors());

const kc = new KubeConfig();
console.log('Loading Kubernetes config from default locations (~/.kube/config / in-cluster)...');
kc.loadFromDefault();
console.log('Kubernetes config loaded.');

const k8sApi: CoreV1Api = kc.makeApiClient(CoreV1Api);
const execClient = new Exec(kc);

/* ----------------------------- Helpers ----------------------------- */

/**
 * Ensure the namespace exists (create if missing).
 * This prevents hard crashes when namespace does not exist.
 */
async function ensureNamespaceExists() {
  try {
    console.log(`Checking namespace '${NAMESPACE}' existence...`);
    await k8sApi.readNamespace(NAMESPACE);
    console.log(`Namespace '${NAMESPACE}' already exists.`);
  } catch (err: any) {
    // 404 -> create namespace
    if (err?.statusCode === 404 || /NotFound/i.test(err?.body || err?.message || '')) {
      console.log(`Namespace '${NAMESPACE}' not found. Creating it now...`);
      try {
        await k8sApi.createNamespace({
          metadata: { name: NAMESPACE },
        } as any);
        console.log(`Namespace '${NAMESPACE}' created.`);
      } catch (createErr) {
        console.error(`Failed to create namespace '${NAMESPACE}':`, createErr);
        throw createErr;
      }
    } else {
      console.error('Error while checking namespace existence:', err);
      throw err;
    }
  }
}

/**
 * List running or pending pods in our namespace.
 * Used to check whether the pod for project already exists.
 */
async function listPods(): Promise<string[]> {
  console.log(`Listing pods in namespace '${NAMESPACE}'...`);
  const res = await k8sApi.listNamespacedPod(NAMESPACE);
  const pods = (res.body?.items || res.items || [])
    .filter((p: any) => {
      const phase = p.status?.phase;
      return phase === 'Running' || phase === 'Pending';
    })
    .map((p: any) => p.metadata?.name)
    .filter(Boolean) as string[];

  console.log('Running/Pending pods:', pods);
  return pods;
}

/**
 * Create the Pod with 3 containers and the three Services.
 * EXACT behavior mirrors original images & ports.
 */
async function createPod(name: string) {
  console.log(`Creating pod '${name}' in namespace '${NAMESPACE}'...`);

  const podManifest = {
    metadata: {
      name,
      labels: { app: name },
    },
    spec: {
      containers: [
        {
          name: 'code-server',
          image: '100xdevs/code-server-base:v3',
          ports: [{ containerPort: 8080 }, { containerPort: 8081 }],
        },
        {
          name: 'ws-relayer',
          image: '100xdevs/antidevs-ws-relayer:ff488d08f7a2bf15c77d9787352a79468c14fc3f',
          ports: [{ containerPort: 9093 }],
        },
        {
          name: 'worker',
          image: '100xdevs/antidevs-worker:ff488d08f7a2bf15c77d9787352a79468c14fc3f',
          ports: [{ containerPort: 9091 }],
          env: [
            {
              name: 'WS_RELAYER_URL',
              value: 'ws://localhost:9091',
            },
            {
              name: 'ANTHROPIC_API_KEY',
              valueFrom: {
                secretKeyRef: { name: 'worker-secret', key: 'ANTHROPIC_API_KEY' },
              },
            },
            {
              name: 'DATABASE_URL',
              valueFrom: {
                secretKeyRef: { name: 'worker-secret', key: 'DATABASE_URL' },
              },
            },
          ],
        },
      ],
    },
  };

  try {
    // Create Pod
    console.log('Submitting Pod manifest to Kubernetes API...');
    await k8sApi.createNamespacedPod(NAMESPACE, podManifest as any);
    console.log(`Pod '${name}' creation requested.`);

    // Create Services: session, preview, worker
    const services = [
      {
        metadata: { name: `session-${name}` },
        spec: {
          selector: { app: name },
          ports: [{ port: 8080, targetPort: 8080, protocol: 'TCP', name: 'session' }],
        },
      },
      {
        metadata: { name: `preview-${name}` },
        spec: {
          selector: { app: name },
          ports: [{ port: 8080, targetPort: 8081, protocol: 'TCP', name: 'preview' }],
        },
      },
      {
        metadata: { name: `worker-${name}` },
        spec: {
          selector: { app: name },
          ports: [{ port: 8080, targetPort: 9091, protocol: 'TCP', name: 'worker' }],
        },
      },
    ];

    for (const svc of services) {
      console.log(`Creating service '${svc.metadata.name}'...`);
      try {
        await k8sApi.createNamespacedService(NAMESPACE, svc as any);
        console.log(`Service '${svc.metadata.name}' created.`);
      } catch (svcErr: any) {
        if (svcErr?.statusCode === 409 || /AlreadyExists/i.test(svcErr?.body || svcErr?.message || '')) {
          console.log(`Service '${svc.metadata.name}' already exists — skipping creation.`);
        } else {
          console.error(`Failed to create service '${svc.metadata.name}':`, svcErr);
          throw svcErr;
        }
      }
    }
  } catch (err) {
    console.error('Failed to create pod or services:', err);
    throw err;
  }
}

/**
 * Poll the pod until it becomes "Running" (with a simple retry/backoff).
 * Throws if max attempts exceeded.
 */
async function waitForPodReady(name: string, maxAttempts = 15, intervalMs = 2000) {
  console.log(`Waiting for pod '${name}' to be Ready...`);
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const pod = await k8sApi.readNamespacedPodStatus(name, NAMESPACE);
      const phase = pod.body?.status?.phase || pod.status?.phase;
      console.log(`Pod '${name}' status:`, phase);
      if (phase === 'Running') {
        console.log(`Pod '${name}' is Running.`);
        return;
      }
    } catch (err) {
      console.log(`Read pod status attempt ${attempts + 1} failed (may not be created yet).`);
    }

    attempts++;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`Pod '${name}' did not become Running after ${maxAttempts} attempts.`);
}

/**
 * Exec into code-server container and move project files into /app
 * This returns stdout and stderr for logging.
 */
async function execMoveProjectToPod(name: string, projectType: 'NEXTJS' | 'REACT_NATIVE' | 'REACT') {
  console.log(`Preparing to exec into pod '${name}' to move project files...`);
  const baseFolder = PROJECT_TYPE_TO_BASE_FOLDER[projectType];
  const cmd = ['/bin/sh', '-c', `mv ${baseFolder}/* /app`];

  let stdout = '';
  let stderr = '';

  // Writable collectors for stdout & stderr from the exec stream
  const stdoutStream = new Writable({
    write(chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text); // also print to host logs
      cb();
    },
  });

  const stderrStream = new Writable({
    write(chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
      cb();
    },
  });

  console.log(`Exec command: ${cmd.join(' ')}`);

  // exec: (namespace, podName, containerName, command, stdout, stderr, stdin, tty, callback)
  // We use the callback form to detect completion; we wrap in a Promise.
  await new Promise<void>((resolve, reject) => {
    execClient.exec(
      NAMESPACE,
      name,
      'code-server',
      cmd,
      stdoutStream,
      stderrStream,
      null,
      false,
      (status) => {
        // status is an object containing exit code and reason in many client versions
        console.log('Exec finished with status:', status);
        if (status && (status as any).status === 'Success') {
          resolve();
        } else {
          // Some Kubernetes client versions don't provide structured status; consider non-empty stderr/failing exit as failure
          if (stderr.length > 0) {
            reject(new Error(`Exec command failed: ${stderr}`));
          } else {
            resolve();
          }
        }
      }
    );
  });

  console.log('Exec stdout:', stdout);
  console.log('Exec stderr:', stderr);
}

/* ----------------------------- High level flow ----------------------------- */

/**
 * Assign a project to pod:
 * - ensure namespace exists
 * - check pod exists -> create one if not
 * - wait for ready
 * - exec move files into /app inside code-server container
 */
async function assignPodToProject(projectId: string, projectType: 'NEXTJS' | 'REACT_NATIVE' | 'REACT') {
  const start = Date.now();
  try {
    // Ensure namespace exists (safe operation)
    await ensureNamespaceExists();

    const pods = await listPods();
    const podExists = pods.includes(projectId);

    if (!podExists) {
      console.log(`Pod '${projectId}' not found. Creating...`);
      await createPod(projectId);
    } else {
      console.log(`Pod '${projectId}' already exists.`);
    }

    // Wait until pod becomes running
    await waitForPodReady(projectId);

    // Exec to move files into /app
    console.log(`Moving project files for '${projectId}' (type=${projectType}) into pod...`);
    await execMoveProjectToPod(projectId, projectType);

    const durationMs = Date.now() - start;
    // record metric in seconds
    containerCreateBucket.observe({ type: projectType }, durationMs / 1000);
    console.log(`Project '${projectId}' assigned to pod '${projectId}' in ${durationMs}ms.`);
  } catch (err) {
    console.error(`Failed to assign project '${projectId}' to pod:`, err);
    throw err;
  }
}

/* ----------------------------- Routes ----------------------------- */

/**
 * Worker route: find project, then assign Pod and return URLs.
 * Preserves original behavior: checks DB for project existence.
 */
app.get('/worker/:projectId', async (req, res) => {
  const projectId = req.params.projectId as string;
  console.log(`Received /worker request for projectId='${projectId}'`);

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.log(`Project ${projectId} not found in DB.`);
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    console.log(`Project ${projectId} found in DB (type=${project.type}). Starting assignment...`);

    // Keep original mapping: we pass "REACT" always in original code — but use project's type if present.
    const projectType = (project.type as 'NEXTJS' | 'REACT_NATIVE' | 'REACT') || 'REACT';
    await assignPodToProject(projectId, projectType);

    console.log('Returning session / preview / worker URLs to caller.');
    res.json({
      sessionUrl: `https://session-${projectId}.${DOMAIN}`,
      previewUrl: `https://preview-${projectId}.${DOMAIN}`,
      workerUrl: `https://worker-${projectId}.${DOMAIN}`,
    });
  } catch (err) {
    console.error('Error in /worker route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Prometheus metrics endpoint
 */
app.get('/metrics', async (_req, res) => {
  try {
    res.setHeader('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics);
  } catch (err) {
    console.error('Failed to fetch metrics:', err);
    res.status(500).send('Error collecting metrics');
  }
});

/* ----------------------------- Start server ----------------------------- */

const PORT = process.env.PORT ? Number(process.env.PORT) : 7001;
app.listen(PORT, () => {
  console.log(`Kubernetes worker server listening on port ${PORT}`);
  console.log(`Using namespace: ${NAMESPACE}`);
});
