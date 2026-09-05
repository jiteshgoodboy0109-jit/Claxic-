import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'claxic.db');
const DATA_FILE = path.join(__dirname, 'data.json');

// Password Hashing Utility (PBKDF2 with SHA-512 & Salt)
export function hashPassword(password, salt) {
  const saltHex = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, saltHex, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: saltHex };
}

export function verifyPassword(password, storedHash, salt) {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

// Initial Admin & Demo User Password Hashes
const adminCreds = hashPassword('Admin@123456', 'claxic_salt_admin_2026');
const staffCreds = hashPassword('Staff@123456', 'claxic_salt_staff_2026');
const studentCreds = hashPassword('Student@123456', 'claxic_salt_student_2026');

// Helper to generate rich curriculum classes with videos, topics, summaries, and tests
export const getDefaultClassesForCourse = (courseId, courseTitle = 'Engineering Masterclass') => [
  {
    id: `cls_${courseId}_1`,
    classNumber: 1,
    dayNumber: 1,
    title: 'Day 1: Architectural Foundations, Prerequisites & Environment Setup',
    duration: '1 hr 30 mins',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    topics: ['Dev environment setup', 'Node.js & TypeScript tooling', 'Docker Compose configurations', 'Project structure best practices'],
    summary: 'In this opening session, we laid out the end-to-end architectural blueprints. We installed dependencies, walked through the repository structure, configured our environment variables, and initialized containerized databases with Docker Compose.',
    learningMaterials: [
      { title: 'Lecture Notes & Slides (PDF)', url: 'https://github.com/claxic-academy/lecture-notes-day-1' },
      { title: 'Starter Template Repository (GitHub)', url: 'https://github.com/claxic-academy/starter-template' },
      { title: 'Docker Compose Cheat Sheet', url: 'https://docs.docker.com/compose/' },
    ],
    status: 'PUBLISHED',
    uploadedAt: '2026-08-25T10:00:00.000Z',
    uploadedBy: 'Dr. Sarah Jenkins (Staff)',
    test: {
      id: `test_${courseId}_1`,
      title: 'Day 1 Assessment: Environment & Architecture Foundations',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          question: 'What is the primary purpose of containerizing local services with Docker Compose?',
          options: [
            'Guaranteeing consistent execution environments across team members',
            'Compiling TypeScript code into binary executables',
            'Encrypting HTTP cookies in the browser',
            'Replacing standard git version control workflows'
          ],
          correctIndex: 0,
          explanation: 'Docker Compose provides deterministic environments for databases, caches, and services, eliminating the "works on my machine" problem.'
        },
        {
          id: 'q2',
          question: 'Which HTTP status code signifies that a newly created resource was successfully stored?',
          options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified'],
          correctIndex: 1,
          explanation: 'HTTP 201 Created indicates the request succeeded and resulted in one or more new resources.'
        },
        {
          id: 'q3',
          question: 'Why should environment credentials and API secrets NEVER be hardcoded into source control?',
          options: [
            'They slow down web browser page rendering times',
            'They cause immediate syntax errors during TypeScript compilation',
            'They expose production databases and sensitive keys to unauthorized public access',
            'Git does not allow commits that contain strings longer than 16 characters'
          ],
          correctIndex: 2,
          explanation: 'Secrets stored in git can be harvested by malicious actors. Use .env files and secret managers instead.'
        }
      ]
    }
  },
  {
    id: `cls_${courseId}_2`,
    classNumber: 2,
    dayNumber: 2,
    title: 'Day 2: Relational Schema Modeling, Indexes & ACID Transactions',
    duration: '1 hr 45 mins',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    topics: ['PostgreSQL & SQLite schema design', 'Foreign key constraints & cascade behaviors', 'B-Tree indexing strategies', 'ACID transaction isolation levels'],
    summary: 'Today we dove deep into production relational database engineering. We constructed normalized tables, designed composite indexes to eliminate table scans, and wrote multi-step database transactions with atomic rollback guarantees.',
    learningMaterials: [
      { title: 'Schema Modeling Guidelines (PDF)', url: 'https://github.com/claxic-academy/schema-design-guide' },
      { title: 'Database Indexing Benchmarks', url: 'https://github.com/claxic-academy/indexing-benchmarks' },
    ],
    status: 'PUBLISHED',
    uploadedAt: '2026-08-28T10:00:00.000Z',
    uploadedBy: 'Dr. Sarah Jenkins (Staff)',
    test: {
      id: `test_${courseId}_2`,
      title: 'Day 2 Assessment: Relational Data Integrity & Transactions',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          question: 'What does the "A" in ACID database properties stand for?',
          options: ['Asynchronous', 'Atomicity', 'Authentication', 'Availability'],
          correctIndex: 1,
          explanation: 'Atomicity ensures that all statements within a transaction are executed successfully or completely rolled back.'
        },
        {
          id: 'q2',
          question: 'When should an index ideally be placed on a database column?',
          options: [
            'When the column is frequently queried with WHERE, JOIN, or ORDER BY filters',
            'On every single column in every table regardless of access patterns',
            'Only on columns with text longer than 5,000 characters',
            'Only when the database has fewer than 10 total records'
          ],
          correctIndex: 0,
          explanation: 'Indexes optimize lookups for filtering and joining columns while avoiding unnecessary write overhead on infrequently queried fields.'
        }
      ]
    }
  },
  {
    id: `cls_${courseId}_3`,
    classNumber: 3,
    dayNumber: 3,
    title: 'Day 3: High-Performance APIs, Authentication & Security Middleware',
    duration: '1 hr 30 mins',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    topics: ['PBKDF2 & Bcrypt password hashing', 'JWT stateless tokens & session stores', 'Rate limiting with token bucket algorithms', 'CORS, CSP and Helmet security headers'],
    summary: 'In this session, we built production-grade authentication and route security. We implemented cryptographic salting and hashing, configured token rotation to prevent session hijacking, and applied rate-limiting middleware to guard against DDoS attacks.',
    learningMaterials: [
      { title: 'OWASP Top 10 API Security Checklist', url: 'https://owasp.org/www-project-api-security/' },
      { title: 'Security Middleware Code Samples', url: 'https://github.com/claxic-academy/auth-security-samples' },
    ],
    status: 'PUBLISHED',
    uploadedAt: '2026-09-01T10:00:00.000Z',
    uploadedBy: 'Dr. Sarah Jenkins (Staff)',
    test: {
      id: `test_${courseId}_3`,
      title: 'Day 3 Assessment: Cryptography & Route Protection',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          question: 'Why is a unique cryptographic salt required for each user password hash?',
          options: [
            'It prevents precomputed Rainbow Table attacks and duplicate hash lookups',
            'It decreases the length of the hashed string stored in the database',
            'It allows the server to recover the original plaintext password if forgotten',
            'It forces the browser to cache user login credentials'
          ],
          correctIndex: 0,
          explanation: 'Salts prevent rainbow table attacks by ensuring identical passwords yield distinct cryptographic hashes.'
        },
        {
          id: 'q2',
          question: 'Which header prevents clickjacking attacks by forbidding iframe embedding on untrusted domains?',
          options: ['X-Frame-Options: DENY', 'Content-Type: text/html', 'Access-Control-Allow-Origin: *', 'Cache-Control: no-cache'],
          correctIndex: 0,
          explanation: 'X-Frame-Options or CSP frame-ancestors prevents malicious websites from rendering your application within invisible iframes.'
        }
      ]
    }
  },
  {
    id: `cls_${courseId}_4`,
    classNumber: 4,
    dayNumber: 4,
    title: 'Day 4: Real-Time Protocols, WebSockets & Event-Driven Architecture',
    duration: '2 hrs 00 mins',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    topics: ['WebSocket handshake & persistent duplex connections', 'Pub/Sub broadcasting mechanisms', 'Heartbeats, connection drop recovery & exponential backoff', 'Message queuing'],
    summary: 'We tackled real-time communication patterns. We transitioned from short-polling to persistent bidirectional WebSockets, integrated pub/sub channels, and added reconnection logic with jitter and backoff.',
    learningMaterials: [
      { title: 'WebSocket Protocol Reference & RFC', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' },
      { title: 'Pub/Sub Architecture Diagrams', url: 'https://github.com/claxic-academy/realtime-pubsub-guide' },
    ],
    status: 'PUBLISHED',
    uploadedAt: '2026-09-02T10:00:00.000Z',
    uploadedBy: 'Dr. Sarah Jenkins (Staff)',
    test: {
      id: `test_${courseId}_4`,
      title: 'Day 4 Assessment: Real-Time Event Communication',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          question: 'What protocol does a client use to initiate a WebSocket connection over HTTP?',
          options: ['HTTP Upgrade Header (101 Switching Protocols)', 'POST multipart/form-data', 'GraphQL Mutation', 'DNS TXT Record'],
          correctIndex: 0,
          explanation: 'The client sends an HTTP Upgrade request, and the server responds with 101 Switching Protocols to establish the full-duplex TCP stream.'
        }
      ]
    }
  },
  {
    id: `cls_${courseId}_5`,
    classNumber: 5,
    dayNumber: 5,
    title: 'Day 5: Capstone Model Synthesis, Deployment & Final Project Guidelines',
    duration: '1 hr 45 mins',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    topics: ['Full-stack system integration', 'Cloud deployment best practices', 'GitHub repository structure for final project', 'Documentation, architecture diagramming, and rubric evaluation'],
    summary: 'Our capstone session brought every component together into a cohesive production system. We introduced the Final Course Project rubric, explained the GitHub submission requirements, demonstrated live container deployment, and outlined the criteria staff will use during peer and faculty reviews.',
    learningMaterials: [
      { title: 'Final Capstone Project Specification & Rubric (PDF)', url: 'https://github.com/claxic-academy/final-project-spec' },
      { title: 'Sample Submission Repository (GitHub)', url: 'https://github.com/claxic-academy/sample-capstone-submission' },
      { title: 'Production Deployment Runbook', url: 'https://github.com/claxic-academy/deployment-runbook' }
    ],
    status: 'PUBLISHED',
    uploadedAt: '2026-09-03T10:00:00.000Z',
    uploadedBy: 'Dr. Sarah Jenkins (Staff)',
    test: {
      id: `test_${courseId}_5`,
      title: 'Day 5 Assessment: Production Readiness & Deployment',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          question: 'What must be included in your final course project submission on GitHub?',
          options: [
            'Clean source code, comprehensive README documentation, architecture overview, and instructions to run locally',
            'Only a raw zip file without git version history',
            'Hardcoded API keys and credentials in the public repository',
            'Only a screenshot without any executable code'
          ],
          correctIndex: 0,
          explanation: 'A professional submission requires clean git history, documentation, architecture diagrams, and runnable code.'
        }
      ]
    }
  }
];

export const initialData = {
  users: [
    {
      id: 'usr_admin_jitesh',
      name: 'Jitesh (Admin)',
      email: 'jitesh.0901.jitesh@gmail.com',
      mobile: '+91 82209 45226',
      role: 'ADMIN',
      isVerified: true,
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIDzF_GisSo6ZtQuETKBKYaafoQh4lXkfnyKC90O0mAXMeCcjWV=s96-c',
      institution: 'Claxic Admin Directorate',
      degree: 'Platform Administrator',
      yearOfStudy: 'Executive Lead',
      isActive: true,
      passwordHash: adminCreds.hash,
      salt: adminCreds.salt,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-30T10:00:00.000Z',
    },
    {
      id: 'usr_admin_jitesh_genkit',
      name: 'Jitesh',
      email: 'jitesh.genkit@gmail.com',
      mobile: '+91 82209 45226',
      role: 'ADMIN',
      isVerified: true,
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIYSp0Z_nYpqNbrWCCk8Bfj0Dja7WPwsynFWpsDFYkNjp_b4w=s96-c',
      institution: 'Claxic Admin Directorate',
      degree: 'Platform Administrator',
      yearOfStudy: 'Executive Lead',
      isActive: true,
      passwordHash: adminCreds.hash,
      salt: adminCreds.salt,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-30T10:00:00.000Z',
    },
    {
      id: 'usr_admin_system',
      name: 'Claxic System Admin',
      email: 'admin@claxic.edu',
      mobile: '+91 82209 45226',
      role: 'ADMIN',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      institution: 'Claxic Academic Directorate',
      degree: 'System Administration',
      yearOfStudy: 'Faculty Lead',
      isActive: true,
      passwordHash: adminCreds.hash,
      salt: adminCreds.salt,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-08-30T10:00:00.000Z',
    },
    {
      id: 'usr_staff_sarah',
      name: 'Dr. Sarah Jenkins (Staff)',
      email: 'staff@claxic.edu',
      mobile: '+91 98765 43210',
      role: 'STAFF',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      institution: 'Claxic Faculty Directorate',
      degree: 'Lead Curriculum & Admissions Reviewer',
      yearOfStudy: 'Senior Staff Member',
      isActive: true,
      passwordHash: staffCreds.hash,
      salt: staffCreds.salt,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-30T10:00:00.000Z',
    },
  ],
  courses: [
    {
      id: 'crs_ai_fullstack_2026',
      slug: 'applied-genai-fullstack-engineering',
      title: 'Applied GenAI & Full-Stack System Architecture',
      shortDescription: 'Master modern full-stack development with Gemini 2.5 Flash, TypeScript, Vector DBs, Agentic Workflows, and Distributed Microservices.',
      fullDescription: 'An intensive, hands-on 12-week professional program engineered for software developers wanting to bridge modern React/Node architecture with state-of-the-art Generative AI. You will build enterprise RAG pipelines, deploy real-time multi-agent systems, optimize LLM context caching, and deploy auto-scaling microservices on Google Cloud Run and Kubernetes.',
      bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      category: 'AI & Full Stack',
      level: 'Intermediate',
      mode: 'Live Interactive',
      duration: '12 Weeks (84 Live Hours)',
      startDate: '2026-09-15',
      endDate: '2026-12-08',
      registrationDeadline: '2026-09-10',
      price: 14999,
      originalPrice: 24999,
      capacity: 45,
      enrolledCount: 38,
      status: 'PUBLISHED',
      featured: true,
      rating: 4.94,
      reviewsCount: 320,
      tags: ['GenAI', 'React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      instructor: {
        id: 'inst_dr_aravind',
        name: 'Dr. Aravind Sundararajan',
        title: 'Principal AI Architect & Ex-Google DeepMind Staff Engineer',
        company: 'Claxic AI Research Labs',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Over 14 years building planetary-scale AI systems and leading production ML infra teams across Silicon Valley and Bengaluru.'
      },
      modules: [
        {
          id: 'mod_1',
          title: 'Foundations of Modern Distributed Web Architecture',
          duration: '2 Weeks (14 Hours)',
          topics: ['High-throughput Express/Fastify TypeScript patterns', 'ACID transaction guarantees and relational schema modeling with PostgreSQL & Prisma', 'Caching hierarchies: Redis multi-tier invalidation strategies', 'Containerized local setups with Docker Compose & DevContainers']
        },
        {
          id: 'mod_2',
          title: 'Deep Dive: LLM Integrations & Agentic Frameworks',
          duration: '3 Weeks (21 Hours)',
          topics: ['Google GenAI SDK deep dive: Multimodal prompts, Structured JSON schema outputs', 'Building autonomous tool-calling Agents with ReAct & Graph workflows', 'Production RAG: Chunking heuristics, hybrid BM25 + dense embeddings search', 'Cost controls: Context caching, token streaming, and fallback routing']
        },
        {
          id: 'mod_3',
          title: 'Real-Time Systems & Collaborative Frontends',
          duration: '3 Weeks (21 Hours)',
          topics: ['React 19 Server Components, Actions, and Optimistic UI updates', 'WebSocket orchestration with Redis Pub/Sub backplanes', 'State management with Zustand and TanStack React Query cache synchronization', 'Accessibility compliance (WCAG 2.1 AA) and resilient design systems']
        },
        {
          id: 'mod_4',
          title: 'Production Observability, Security & Cloud Deployment',
          duration: '4 Weeks (28 Hours)',
          topics: ['Zero-trust authentication: OAuth 2.1, RBAC, JWT rotation, and PKCE flows', 'CI/CD pipelines on GitHub Actions with automated linting & end-to-end testing', 'Deploying to Cloud Run with scale-to-zero and VPC serverless connectors', 'Capstone project evaluation and 1-on-1 industry architectural review']
        }
      ],
      learningOutcomes: [
        'Architect production-ready full-stack applications with bulletproof type safety and schema validation.',
        'Deploy autonomous AI agents with function calling, tool execution, and vector-backed knowledge bases.',
        'Optimize database queries, indexes, and connection pooling for 10k+ concurrent users.',
        'Implement real-world payment processing, OAuth flows, and webhooks with idempotent recovery.'
      ],
      requirements: [
        'Proficiency in JavaScript/TypeScript and foundational understanding of React.',
        'Basic familiarity with RESTful APIs, Git, and relational databases.',
        'A development laptop with at least 8GB RAM (16GB recommended) and Node.js v20+.'
      ],
      faq: [
        { question: 'Are the live sessions recorded for later access?', answer: 'Yes, all live workshops are recorded in 4K resolution and uploaded within 2 hours of class completion along with complete code repositories, slide decks, and sandbox notes.' },
        { question: 'Will I receive a verified certificate upon completion?', answer: 'Yes! Upon completing the capstone project and maintaining 80%+ attendance, you will receive a cryptographically verified Claxic Certificate of Mastery that you can showcase on LinkedIn.' },
        { question: 'Is there installment or EMI payment support?', answer: 'Yes, our Razorpay payment integration supports all major credit/debit card EMIs, UPI, Net Banking, and PayLater schemes with zero-cost EMI options.' }
      ],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-20T14:30:00.000Z'
    },
    {
      id: 'crs_cloud_k8s_2026',
      slug: 'cloud-native-devops-kubernetes-mastery',
      title: 'Cloud-Native DevOps & Kubernetes at Enterprise Scale',
      shortDescription: 'Hands-on training in Docker, Kubernetes, Terraform, ArgoCD GitOps, Helm, and Multi-Cloud Observability on AWS & GCP.',
      fullDescription: 'Master the core infrastructure stack powering world-class tech companies. From containerizing legacy services to deploying zero-downtime blue-green Canary releases with Kubernetes and Service Meshes (Istio), this program equips you with industry-tested DevOps engineering competencies.',
      bannerImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
      category: 'Cloud & DevOps',
      level: 'Advanced',
      mode: 'Bootcamp',
      duration: '10 Weeks (70 Live Hours)',
      startDate: '2026-10-01',
      endDate: '2026-12-15',
      registrationDeadline: '2026-09-25',
      price: 18999,
      originalPrice: 28999,
      capacity: 35,
      enrolledCount: 22,
      status: 'PUBLISHED',
      featured: true,
      rating: 4.88,
      reviewsCount: 194,
      tags: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'GCP', 'ArgoCD', 'Prometheus'],
      instructor: {
        id: 'inst_dev_kapoor',
        name: 'Rohan Kapoor',
        title: 'Principal Infrastructure Engineer',
        company: 'CloudScale Global',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'AWS Certified Solutions Architect Fellow with 11+ years managing 500+ node multi-region Kubernetes clusters.'
      },
      modules: [
        {
          id: 'kmod_1',
          title: 'Linux Internals, Cgroups & Production Containers',
          duration: '2 Weeks (14 Hours)',
          topics: ['Linux namespaces, cgroups, systemd', 'Multi-stage Docker builds', 'Container vulnerability scanning with Trivy']
        },
        {
          id: 'kmod_2',
          title: 'Kubernetes Core Objects & Cluster Provisioning',
          duration: '3 Weeks (21 Hours)',
          topics: ['Pods, Deployments, StatefulSets, DaemonSets', 'Ingress controllers, Cert-Manager, TLS termination', 'Persistent Volumes & CSI drivers']
        },
        {
          id: 'kmod_3',
          title: 'GitOps, CI/CD & Automated Delivery',
          duration: '3 Weeks (21 Hours)',
          topics: ['Infrastructure as Code with Terraform & OpenTofu', 'ArgoCD GitOps declarative deployments', 'Canary & Blue-Green progressive delivery with Flagger']
        },
        {
          id: 'kmod_4',
          title: 'Observability, SRE & Incident Response',
          duration: '2 Weeks (14 Hours)',
          topics: ['Prometheus metrics, PromQL, Grafana dashboards', 'Distributed tracing with OpenTelemetry & Jaeger', 'Chaos engineering with LitmusChaos']
        }
      ],
      learningOutcomes: [
        'Build and operate production-grade Kubernetes clusters on GCP (GKE) and AWS (EKS).',
        'Automate complete infrastructure provisioning using Terraform and GitOps with ArgoCD.',
        'Configure enterprise observability, alert manager rules, and MTTR reduction runbooks.'
      ],
      requirements: [
        'Basic knowledge of Linux command line and Git.',
        'Understanding of networking concepts (DNS, TCP/IP, HTTP, Load Balancing).'
      ],
      faq: [
        { question: 'Do I need a paid cloud account for the labs?', answer: 'No! We provide dedicated cloud sandbox credits and local Minikube/Kind configurations so you can practice without personal cloud expenses.' }
      ],
      createdAt: '2026-08-05T10:00:00.000Z',
      updatedAt: '2026-08-22T12:00:00.000Z'
    },
    {
      id: 'crs_system_design_2026',
      slug: 'distributed-system-design-high-scale',
      title: 'Distributed System Design & High-Concurrency Architecture',
      shortDescription: 'Master the architectural patterns used by Netflix, Uber, and Google. Sharding, Consistent Hashing, Event-Driven Architecture, and Resiliency.',
      fullDescription: 'Designed specifically for mid-level and senior engineers targeting Staff Engineer roles. Learn how to design fault-tolerant systems handling millions of queries per second with sub-millisecond latency, distributed consensus (Raft/Paxos), and event-driven patterns.',
      bannerImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      category: 'System Architecture',
      level: 'Advanced',
      mode: 'Live Interactive',
      duration: '8 Weeks (48 Live Hours)',
      startDate: '2026-10-10',
      endDate: '2026-12-05',
      registrationDeadline: '2026-10-05',
      price: 16999,
      originalPrice: 25999,
      capacity: 50,
      enrolledCount: 46,
      status: 'PUBLISHED',
      featured: true,
      rating: 4.97,
      reviewsCount: 412,
      tags: ['System Design', 'Kafka', 'Cassandra', 'Microservices', 'Redis', 'High Availability'],
      instructor: {
        id: 'inst_vikram_singh',
        name: 'Vikramaditya Singh',
        title: 'Distinguished Systems Architect',
        company: 'ScaleX Systems',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: 'Author of "Scaling to 100M Daily Actives" and former lead architect behind high-concurrency payment switches.'
      },
      modules: [
        {
          id: 'sys_1',
          title: 'Core Building Blocks of Distributed Computing',
          duration: '2 Weeks (12 Hours)',
          topics: ['CAP theorem in practice, PACELC', 'Consistent hashing & ring topologies', 'LSM trees vs B-Trees in database engines']
        },
        {
          id: 'sys_2',
          title: 'Message Queues, Streaming & Event Sourcing',
          duration: '2 Weeks (12 Hours)',
          topics: ['Apache Kafka internals: partitions, consumer groups, offsets', 'Idempotent consumer patterns & Saga transactions', 'Change Data Capture (CDC) with Debezium']
        },
        {
          id: 'sys_3',
          title: 'Real-World System Case Studies',
          duration: '2 Weeks (12 Hours)',
          topics: ['Designing a Global Ride-Hailing Match Engine (Uber)', 'Designing a Collaborative Real-Time Whiteboard (Figma)', 'Designing a Video Streaming CDN with Adaptive Bitrate (Netflix)']
        },
        {
          id: 'sys_4',
          title: 'Disaster Recovery, Rate Limiting & Mock Interviews',
          duration: '2 Weeks (12 Hours)',
          topics: ['Token bucket, leaky bucket & distributed sliding window limiters', 'Circuit breakers (Resilience4j) and bulkhead patterns', '1-on-1 mock system design interview simulations']
        }
      ],
      learningOutcomes: [
        'Design reliable, fault-tolerant distributed systems capable of scaling to millions of QPS.',
        'Confidently lead Staff/Principal engineering system design interviews at Tier-1 tech giants.'
      ],
      requirements: [
        'At least 2 years of backend or full-stack software development experience.'
      ],
      faq: [
        { question: 'Does this course include 1-on-1 design mock sessions?', answer: 'Yes! Every enrolled participant receives a scheduled 45-minute live mock design interview with our lead faculty.' }
      ],
      createdAt: '2026-08-10T10:00:00.000Z',
      updatedAt: '2026-08-25T11:00:00.000Z'
    },
    {
      id: 'crs_cybersec_2026',
      slug: 'advanced-cybersecurity-ethical-hacking',
      title: 'Advanced Cyber Defense & Practical Ethical Hacking',
      shortDescription: 'Master web application security (OWASP Top 10), network penetration testing, API vulnerability exploitation, and DevSecOps safeguards.',
      fullDescription: 'Comprehensive training in modern cybersecurity defense and ethical penetration testing. Learn how attackers think, how to audit codebases for zero-day flaws, how to secure cloud environments, and how to build automated security gates in CI/CD pipelines.',
      bannerImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      category: 'Cyber Security',
      level: 'Intermediate',
      mode: 'Hybrid Workshop',
      duration: '8 Weeks (56 Live Hours)',
      startDate: '2026-09-20',
      endDate: '2026-11-15',
      registrationDeadline: '2026-09-16',
      price: 12999,
      originalPrice: 19999,
      capacity: 40,
      enrolledCount: 33,
      status: 'PUBLISHED',
      featured: false,
      rating: 4.91,
      reviewsCount: 154,
      tags: ['Cybersecurity', 'Ethical Hacking', 'OWASP', 'Burp Suite', 'DevSecOps', 'Network Security'],
      instructor: {
        id: 'inst_meera_nair',
        name: 'Meera Nair, CISSP',
        title: 'Head of Information Security & Red Teamer',
        company: 'Fortress Defense Labs',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        bio: 'Certified Red Team Operator with a decade of enterprise security audits for banking and government infrastructure.'
      },
      modules: [
        {
          id: 'sec_1',
          title: 'Modern Threat Modeling & Web App Penetration Testing',
          duration: '2 Weeks (14 Hours)',
          topics: ['Burp Suite Professional masterclass', 'SQL Injection, XSS, SSRF, IDOR, CSRF bypasses', 'OAuth2 token forgery and JWT flaws']
        },
        {
          id: 'sec_2',
          title: 'API Security & Microservice Defense',
          duration: '2 Weeks (14 Hours)',
          topics: ['REST & GraphQL penetration testing', 'BOLA (Broken Object Level Auth) discovery', 'Rate limit bypass and API gateway security']
        },
        {
          id: 'sec_3',
          title: 'Cloud Security Posture Management & DevSecOps',
          duration: '2 Weeks (14 Hours)',
          topics: ['AWS & GCP IAM privilege escalation auditing', 'SAST & DAST tool integration with GitHub Actions', 'Secrets management with HashiCorp Vault']
        },
        {
          id: 'sec_4',
          title: 'Live Capture The Flag (CTF) & Remediation Clinic',
          duration: '2 Weeks (14 Hours)',
          topics: ['Competitive CTF lab scenarios', 'Writing executive penetration test reports', 'Defensive blue-team hardening playbooks']
        }
      ],
      learningOutcomes: [
        'Conduct end-to-end vulnerability assessments on modern web and API applications.',
        'Identify and remediate high-severity OWASP Top 10 vulnerabilities before production release.',
        'Implement automated security scanning into continuous deployment pipelines.'
      ],
      requirements: [
        'Solid grasp of networking fundamentals, HTTP protocol, and basic programming.'
      ],
      faq: [
        { question: 'Will we have legal permissions to hack in this course?', answer: 'All exercises are hosted on our dedicated, isolated Claxic Cyber Range containing realistic vulnerable target systems.' }
      ],
      createdAt: '2026-08-08T10:00:00.000Z',
      updatedAt: '2026-08-24T15:00:00.000Z'
    },
    {
      id: 'crs_uiux_product_2026',
      slug: 'digital-product-design-design-systems',
      title: 'Digital Product Design & Enterprise Design Systems',
      shortDescription: 'From user research to design systems in Figma, interactive micro-interactions, accessibility math, and design-to-code handoffs.',
      fullDescription: 'Craft intuitive, world-class user experiences for complex software products. Learn UX research heuristics, rapid prototyping, building tokenized multi-brand design systems in Figma, and collaborating seamlessly with frontend engineering teams.',
      bannerImage: 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?auto=format&fit=crop&w=1200&q=80',
      category: 'Product & Design',
      level: 'All Levels',
      mode: 'Self-Paced',
      duration: '6 Weeks (36 Live & Lab Hours)',
      startDate: '2026-09-18',
      endDate: '2026-10-30',
      registrationDeadline: '2026-09-15',
      price: 9999,
      originalPrice: 15999,
      capacity: 60,
      enrolledCount: 48,
      status: 'PUBLISHED',
      featured: false,
      rating: 4.92,
      reviewsCount: 210,
      tags: ['UI/UX', 'Figma', 'Design Systems', 'Micro-interactions', 'Accessibility', 'Prototyping'],
      instructor: {
        id: 'inst_tanya_roy',
        name: 'Tanya Roy',
        title: 'Lead Product Designer',
        company: 'HyperCraft Studio',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        bio: 'Design systems advocate and judge for international digital product design competitions.'
      },
      modules: [
        {
          id: 'des_1',
          title: 'User Psychology & Heuristic Discovery',
          duration: '1.5 Weeks (9 Hours)',
          topics: ['User interviews & journey mapping', 'Information architecture & tree testing', 'Wireframing low-to-high fidelity progressions']
        },
        {
          id: 'des_2',
          title: 'Advanced Figma & Tokenized Design Systems',
          duration: '2 Weeks (12 Hours)',
          topics: ['Auto-layout 5.0, variables, typography tokens', 'Component variant architecture & state matrices', 'Dark mode token derivation']
        },
        {
          id: 'des_3',
          title: 'Micro-Interactions & Prototyping',
          duration: '1.5 Weeks (9 Hours)',
          topics: ['Interactive component prototyping with smart animate', 'Mathematical easing curves & tactile feedback', 'Accessibility WCAG AA color contrast math']
        },
        {
          id: 'des_4',
          title: 'Design-to-Code & Portfolio Showcase',
          duration: '1 Week (6 Hours)',
          topics: ['Figma to Tailwind CSS / Shadcn mappings', 'Creating a standout case study for hiring managers']
        }
      ],
      learningOutcomes: [
        'Create end-to-end multi-platform design systems with scalable design tokens.',
        'Produce polished case studies ready for product designer interviews at top startups.'
      ],
      requirements: [
        'No prior design experience required. Just curiosity and a laptop.'
      ],
      faq: [
        { question: 'Is Figma required?', answer: 'Yes, a free Figma account is all you need to participate in all live workshops and assignments.' }
      ],
      createdAt: '2026-08-12T10:00:00.000Z',
      updatedAt: '2026-08-25T16:00:00.000Z'
    },
    {
      id: 'crs_data_science_2026',
      slug: 'modern-data-science-machine-learning',
      title: 'Modern Data Science, Deep Learning & MLOps',
      shortDescription: 'Master statistical machine learning, PyTorch deep learning, feature engineering, model registry, and MLOps deployment pipelines.',
      fullDescription: 'Become an industry-ready Data Scientist capable of translating messy raw business datasets into accurate, operational machine learning models with PyTorch, XGBoost, MLflow, and FastAPI serving.',
      bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      category: 'Data & ML',
      level: 'Intermediate',
      mode: 'Live Interactive',
      duration: '10 Weeks (70 Live Hours)',
      startDate: '2026-10-15',
      endDate: '2026-12-24',
      registrationDeadline: '2026-10-10',
      price: 13999,
      originalPrice: 21999,
      capacity: 40,
      enrolledCount: 40,
      status: 'FULL',
      featured: false,
      rating: 4.89,
      reviewsCount: 165,
      tags: ['Python', 'PyTorch', 'MLOps', 'Pandas', 'XGBoost', 'Deep Learning', 'FastAPI'],
      instructor: {
        id: 'inst_dr_samir',
        name: 'Dr. Samir Bose',
        title: 'Chief Data Scientist',
        company: 'NeuralMatrix Inc',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        bio: 'PhD in Statistical Learning from Carnegie Mellon with 20+ peer-reviewed ML papers and patents.'
      },
      modules: [
        {
          id: 'ds_1',
          title: 'Exploratory Data Analysis & Statistical Modeling',
          duration: '2.5 Weeks (17.5 Hours)',
          topics: ['Pandas & Polars performance comparisons', 'Hypothesis testing, Bayesian priors & A/B testing stats', 'Advanced feature selection and imputation']
        },
        {
          id: 'ds_2',
          title: 'Supervised & Unsupervised Machine Learning',
          duration: '2.5 Weeks (17.5 Hours)',
          topics: ['Gradient Boosting with XGBoost and LightGBM', 'Hyperparameter tuning with Optuna', 'Dimensionality reduction: UMAP vs t-SNE']
        },
        {
          id: 'ds_3',
          title: 'Deep Learning with PyTorch',
          duration: '2.5 Weeks (17.5 Hours)',
          topics: ['Neural network architectures from scratch', 'Transformers, self-attention mechanisms', 'Transfer learning & embeddings fine-tuning']
        },
        {
          id: 'ds_4',
          title: 'MLOps, Model Serving & Monitoring',
          duration: '2.5 Weeks (17.5 Hours)',
          topics: ['Model tracking with MLflow', 'Packaging inference APIs with FastAPI and Docker', 'Data drift detection with Evidently AI']
        }
      ],
      learningOutcomes: [
        'Build, evaluate, and fine-tune complex statistical and deep learning models.',
        'Deploy production-ready inference endpoints with automated monitoring and drift alarms.'
      ],
      requirements: [
        'Comfort with Python programming and basic calculus/linear algebra.'
      ],
      faq: [
        { question: 'Is GPU hardware provided for deep learning labs?', answer: 'Yes, cloud GPU instances (NVIDIA T4/A100) are provided at no extra cost.' }
      ],
      createdAt: '2026-08-14T10:00:00.000Z',
      updatedAt: '2026-08-26T18:00:00.000Z'
    }
  ],
  applications: [
    {
      id: 'app_sample_jitesh_001',
      applicationNumber: 'APP-2026-8201',
      userId: 'usr_055ed132fa71fbff',
      userEmail: 'jiteshgoodboy.008@gmail.com',
      userName: 'Jitesh P',
      userMobile: '+91 82209 45226',
      courseId: 'crs_ai_fullstack_2026',
      courseTitle: 'Applied GenAI & Full-Stack System Architecture',
      coursePrice: 14999,
      status: 'CONFIRMED',
      formData: {
        fullName: 'Jitesh P',
        email: 'jiteshgoodboy.008@gmail.com',
        mobile: '+91 82209 45226',
        institution: 'Indian Institute of Technology',
        degree: 'B.Tech AI & Data Science',
        yearOfStudy: 'Final Year',
        experienceLevel: 'Intermediate',
        startDate: '2026-09-01',
      },
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-01T09:00:00.000Z',
    }
  ],
  payments: [
    {
      id: 'pay_sample_jitesh_001',
      receiptNumber: 'REC-2026-9041',
      orderId: 'order_sim_9041',
      paymentId: 'pay_sim_9041',
      userId: 'usr_055ed132fa71fbff',
      userName: 'Jitesh P',
      userEmail: 'jiteshgoodboy.008@gmail.com',
      courseId: 'crs_ai_fullstack_2026',
      courseTitle: 'Applied GenAI & Full-Stack System Architecture',
      applicationId: 'app_sample_jitesh_001',
      amount: 14999,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'Razorpay Online Gateway (UPI/Card)',
      createdAt: '2026-09-01T09:15:00.000Z',
      updatedAt: '2026-09-01T09:15:00.000Z',
    }
  ],
  projectSubmissions: [
    {
      id: 'proj_sample_001',
      userId: 'usr_055ed132fa71fbff',
      userName: 'Jitesh P',
      userEmail: 'jiteshgoodboy.008@gmail.com',
      courseId: 'crs_ai_fullstack_2026',
      courseTitle: 'Applied GenAI & Full-Stack System Architecture',
      projectTitle: 'Enterprise Agentic RAG Pipeline with Real-Time Vector Search',
      description: 'End-to-end full-stack agentic reasoning system built with Node.js, React 19, Gemini 2.5 Flash, SQLite vector caching, and Docker Compose. Supports dynamic tool-calling, document ingestion, and automated citation synthesis.',
      githubUrl: 'https://github.com/jiteshgoodboy/claxic-genai-rag-capstone',
      documentationUrl: 'https://github.com/jiteshgoodboy/claxic-genai-rag-capstone/blob/main/README.md',
      liveDemoUrl: 'https://claxic-rag-demo.vercel.app',
      otherFiles: 'Docker compose file, architecture diagram, benchmark latency results',
      status: 'PENDING_REVIEW',
      staffFeedback: '',
      reviewedBy: '',
      reviewedAt: '',
      submittedAt: '2026-09-03T14:30:00.000Z',
      updatedAt: '2026-09-03T14:30:00.000Z',
    }
  ],
  studentProgress: [
    {
      id: 'prog_sample_001',
      userId: 'usr_055ed132fa71fbff',
      courseId: 'crs_ai_fullstack_2026',
      startDate: '2026-09-01',
      completedClasses: ['cls_crs_ai_fullstack_2026_1', 'cls_crs_ai_fullstack_2026_2'],
      testResults: [
        {
          classId: 'cls_crs_ai_fullstack_2026_1',
          score: 100,
          passed: true,
          totalQuestions: 3,
          correctAnswers: 3,
          submittedAt: '2026-09-01T15:20:00.000Z'
        },
        {
          classId: 'cls_crs_ai_fullstack_2026_2',
          score: 100,
          passed: true,
          totalQuestions: 2,
          correctAnswers: 2,
          submittedAt: '2026-09-02T16:00:00.000Z'
        }
      ],
      attendance: [
        { classId: 'cls_crs_ai_fullstack_2026_1', date: '2026-09-01', attended: true },
        { classId: 'cls_crs_ai_fullstack_2026_2', date: '2026-09-02', attended: true },
      ],
      progressPercent: 40,
      updatedAt: '2026-09-02T16:00:00.000Z',
    }
  ],
  notifications: [],
  auditLogs: [
    {
      id: 'audit_init_001',
      adminId: 'usr_admin_jitesh',
      adminName: 'Jitesh (Admin)',
      action: 'SYSTEM_INITIALIZED',
      targetType: 'SYSTEM',
      targetId: 'claxic_sys_001',
      targetTitle: 'Claxic Academic Platform Activated',
      createdAt: '2026-08-30T00:00:00.000Z',
    },
  ],
  verificationTokens: [],
  passwordResetTokens: [],
  sessions: {},
  emailRecords: [],
};

// SQLite 3 Relational Database Engine with WAL Mode
class SQLiteDatabase {
  constructor() {
    this.sqlite = new DatabaseSync(DB_FILE);
    this.initSchema();
    this.migrateOrSeed();
    this.raw = this.loadAll();
  }

  initSchema() {
    // Enable WAL (Write-Ahead Logging) and foreign key constraints
    this.sqlite.exec('PRAGMA journal_mode = WAL;');
    this.sqlite.exec('PRAGMA foreign_keys = ON;');

    // Users Table
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        mobile TEXT,
        role TEXT NOT NULL DEFAULT 'USER',
        isVerified INTEGER NOT NULL DEFAULT 0,
        avatar TEXT,
        institution TEXT,
        degree TEXT,
        yearOfStudy TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        passwordHash TEXT NOT NULL,
        salt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Courses Table
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        shortDescription TEXT,
        fullDescription TEXT,
        bannerImage TEXT,
        category TEXT NOT NULL,
        level TEXT,
        mode TEXT,
        duration TEXT,
        startDate TEXT,
        endDate TEXT,
        registrationDeadline TEXT,
        price REAL NOT NULL,
        originalPrice REAL,
        capacity INTEGER NOT NULL DEFAULT 30,
        enrolledCount INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'PUBLISHED',
        featured INTEGER NOT NULL DEFAULT 0,
        rating REAL DEFAULT 5.0,
        reviewsCount INTEGER DEFAULT 0,
        tags TEXT,
        instructor TEXT,
        modules TEXT,
        learningOutcomes TEXT,
        requirements TEXT,
        faq TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
      CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
    `);

    // Applications Table
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        applicationNumber TEXT UNIQUE NOT NULL,
        userId TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        userName TEXT NOT NULL,
        userMobile TEXT,
        courseId TEXT NOT NULL,
        courseTitle TEXT NOT NULL,
        coursePrice REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        formData TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(userId);
      CREATE INDEX IF NOT EXISTS idx_applications_course ON applications(courseId);
    `);

    // Payments Table
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        receiptNumber TEXT UNIQUE NOT NULL,
        orderId TEXT,
        paymentId TEXT,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        courseId TEXT NOT NULL,
        courseTitle TEXT NOT NULL,
        applicationId TEXT,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        status TEXT NOT NULL DEFAULT 'SUCCESS',
        paymentMethod TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(userId);
      CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receiptNumber);
    `);

    // Active User Sessions Table
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        expiresAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
    `);

    // Verification & Reset Tokens Tables
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        userId TEXT,
        expiresAt TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        userId TEXT,
        expiresAt TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        link TEXT,
        isRead INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        adminId TEXT NOT NULL,
        adminName TEXT NOT NULL,
        action TEXT NOT NULL,
        targetType TEXT,
        targetId TEXT,
        targetTitle TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS email_records (
        id TEXT PRIMARY KEY,
        toEmail TEXT NOT NULL,
        subject TEXT NOT NULL,
        previewText TEXT,
        timestamp TEXT NOT NULL
      );

      -- Final Project Submissions Table
      CREATE TABLE IF NOT EXISTS project_submissions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        courseId TEXT NOT NULL,
        courseTitle TEXT NOT NULL,
        projectTitle TEXT NOT NULL,
        description TEXT,
        githubUrl TEXT NOT NULL,
        documentationUrl TEXT,
        liveDemoUrl TEXT,
        otherFiles TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
        staffFeedback TEXT,
        reviewedBy TEXT,
        reviewedAt TEXT,
        submittedAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_projects_user ON project_submissions(userId);
      CREATE INDEX IF NOT EXISTS idx_projects_course ON project_submissions(courseId);

      -- Student Course Progress Table
      CREATE TABLE IF NOT EXISTS student_progress (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        courseId TEXT NOT NULL,
        startDate TEXT NOT NULL,
        completedClasses TEXT DEFAULT '[]',
        testResults TEXT DEFAULT '[]',
        attendance TEXT DEFAULT '[]',
        progressPercent INTEGER DEFAULT 0,
        updatedAt TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_course ON student_progress(userId, courseId);
    `);

    // Ensure columns exist if table was previously created with older schema
    try { this.sqlite.exec('ALTER TABLE verification_tokens ADD COLUMN userId TEXT;'); } catch(e) {}
    try { this.sqlite.exec('ALTER TABLE verification_tokens ADD COLUMN used INTEGER NOT NULL DEFAULT 0;'); } catch(e) {}
    try { this.sqlite.exec('ALTER TABLE password_reset_tokens ADD COLUMN userId TEXT;'); } catch(e) {}
    try { this.sqlite.exec('ALTER TABLE password_reset_tokens ADD COLUMN used INTEGER NOT NULL DEFAULT 0;'); } catch(e) {}
    try { this.sqlite.exec("ALTER TABLE courses ADD COLUMN classes TEXT DEFAULT '[]';"); } catch(e) {}
  }

  migrateOrSeed() {
    const row = this.sqlite.prepare('SELECT count(*) as count FROM users').get();
    if (row && row.count > 0) {
      // Ensure standard default accounts have proper roles in SQLite
      try {
        this.sqlite.prepare("UPDATE users SET role = 'ADMIN', isActive = 1 WHERE email = 'admin@claxic.edu'").run();
        this.sqlite.prepare("UPDATE users SET role = 'ADMIN', isActive = 1 WHERE email = 'jitesh.0901.jitesh@gmail.com'").run();
        this.sqlite.prepare("UPDATE users SET role = 'ADMIN', isActive = 1 WHERE email = 'jitesh.genkit@gmail.com'").run();
        this.sqlite.prepare("UPDATE users SET role = 'ADMIN', isActive = 1 WHERE email = 'jiteshgoodboy.0109@gmail.com'").run();

        const checkStaff = this.sqlite.prepare("SELECT * FROM users WHERE email = 'staff@claxic.edu'").get();
        if (!checkStaff) {
          const staff = initialData.users.find((u) => u.email === 'staff@claxic.edu');
          if (staff) {
            const insertUser = this.sqlite.prepare(`
              INSERT INTO users (id, name, email, mobile, role, isVerified, avatar, institution, degree, yearOfStudy, isActive, passwordHash, salt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            insertUser.run(
              staff.id, staff.name, staff.email, staff.mobile || '', staff.role, staff.isVerified ? 1 : 0, staff.avatar || '',
              staff.institution || '', staff.degree || '', staff.yearOfStudy || '', 1, staff.passwordHash, staff.salt, staff.createdAt, staff.updatedAt
            );
          }
        } else {
          this.sqlite.prepare("UPDATE users SET role = 'STAFF', isActive = 1 WHERE email = 'staff@claxic.edu'").run();
        }

        // Ensure courses have rich classes with videos, topics, summaries, and tests populated
        const existingCourses = this.sqlite.prepare('SELECT id, title, classes FROM courses').all();
        for (const c of existingCourses) {
          const parsedClasses = typeof c.classes === 'string' ? JSON.parse(c.classes || '[]') : c.classes || [];
          if (!parsedClasses || parsedClasses.length === 0) {
            const defaultClasses = getDefaultClassesForCourse(c.id, c.title);
            this.sqlite.prepare('UPDATE courses SET classes = ? WHERE id = ?').run(JSON.stringify(defaultClasses), c.id);
          }
        }

        // Seed sample application if applications table is empty
        const appCount = this.sqlite.prepare('SELECT count(*) as count FROM applications').get();
        if (appCount && appCount.count === 0) {
          for (const a of initialData.applications || []) {
            this.sqlite.prepare(`
              INSERT INTO applications (id, applicationNumber, userId, userEmail, userName, userMobile, courseId, courseTitle, coursePrice, status, formData, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              a.id, a.applicationNumber, a.userId, a.userEmail, a.userName, a.userMobile || '',
              a.courseId, a.courseTitle, a.coursePrice || 0, a.status || 'CONFIRMED',
              JSON.stringify(a.formData || {}), a.createdAt, a.updatedAt
            );
          }
        }

        // Seed sample project submissions if table is empty
        const projCount = this.sqlite.prepare('SELECT count(*) as count FROM project_submissions').get();
        if (projCount && projCount.count === 0) {
          for (const p of initialData.projectSubmissions || []) {
            this.sqlite.prepare(`
              INSERT INTO project_submissions (id, userId, userName, userEmail, courseId, courseTitle, projectTitle, description, githubUrl, documentationUrl, liveDemoUrl, otherFiles, status, staffFeedback, reviewedBy, reviewedAt, submittedAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              p.id, p.userId, p.userName, p.userEmail, p.courseId, p.courseTitle, p.projectTitle,
              p.description || '', p.githubUrl || '', p.documentationUrl || '', p.liveDemoUrl || '',
              p.otherFiles || '', p.status || 'PENDING_REVIEW', p.staffFeedback || '', p.reviewedBy || '',
              p.reviewedAt || '', p.submittedAt, p.updatedAt
            );
          }
        }

        // Seed sample student progress if table is empty
        const progCount = this.sqlite.prepare('SELECT count(*) as count FROM student_progress').get();
        if (progCount && progCount.count === 0) {
          for (const sp of initialData.studentProgress || []) {
            this.sqlite.prepare(`
              INSERT INTO student_progress (id, userId, courseId, startDate, completedClasses, testResults, attendance, progressPercent, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              sp.id, sp.userId, sp.courseId, sp.startDate || '',
              JSON.stringify(sp.completedClasses || []), JSON.stringify(sp.testResults || []),
              JSON.stringify(sp.attendance || []), sp.progressPercent || 0, sp.updatedAt
            );
          }
        }
      } catch (e) {
        console.warn('Role and schema migration note:', e.message);
      }
      return; // Database is already populated
    }

    let source = initialData;
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        source = JSON.parse(fileContent);
      } catch (e) {
        console.warn('Could not parse data.json during SQLite bootstrap, using defaults:', e.message);
      }
    }

    this.persistAllToSQLite(source);
    console.log(`[SQLite 3] Initialized and seeded claxic.db successfully with ${source.users.length} users and ${source.courses.length} courses.`);
  }

  persistAllToSQLite(data) {
    this.sqlite.exec('BEGIN IMMEDIATE;');
    try {
      // Clear & Seed Users
      this.sqlite.exec('DELETE FROM users;');
      const insertUser = this.sqlite.prepare(`
        INSERT INTO users (id, name, email, mobile, role, isVerified, avatar, institution, degree, yearOfStudy, isActive, passwordHash, salt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of data.users || []) {
        insertUser.run(
          u.id,
          u.name,
          u.email,
          u.mobile || '',
          u.role || 'USER',
          u.isVerified ? 1 : 0,
          u.avatar || '',
          u.institution || '',
          u.degree || '',
          u.yearOfStudy || '',
          u.isActive === false ? 0 : 1,
          u.passwordHash || '',
          u.salt || '',
          u.createdAt || new Date().toISOString(),
          u.updatedAt || new Date().toISOString()
        );
      }

      // Clear & Seed Courses
      this.sqlite.exec('DELETE FROM courses;');
      const insertCourse = this.sqlite.prepare(`
        INSERT INTO courses (id, slug, title, shortDescription, fullDescription, bannerImage, category, level, mode, duration, startDate, endDate, registrationDeadline, price, originalPrice, capacity, enrolledCount, status, featured, rating, reviewsCount, tags, instructor, modules, learningOutcomes, requirements, faq, classes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of data.courses || []) {
        insertCourse.run(
          c.id,
          c.slug,
          c.title,
          c.shortDescription || '',
          c.fullDescription || '',
          c.bannerImage || '',
          c.category || 'General',
          c.level || 'All Levels',
          c.mode || 'Online',
          c.duration || '',
          c.startDate || '',
          c.endDate || '',
          c.registrationDeadline || '',
          c.price || 0,
          c.originalPrice || 0,
          c.capacity || 30,
          c.enrolledCount || 0,
          c.status || 'PUBLISHED',
          c.featured ? 1 : 0,
          c.rating || 5.0,
          c.reviewsCount || 0,
          JSON.stringify(c.tags || []),
          JSON.stringify(c.instructor || {}),
          JSON.stringify(c.modules || []),
          JSON.stringify(c.learningOutcomes || []),
          JSON.stringify(c.requirements || []),
          JSON.stringify(c.faq || []),
          JSON.stringify(c.classes || getDefaultClassesForCourse(c.id, c.title)),
          c.createdAt || new Date().toISOString(),
          c.updatedAt || new Date().toISOString()
        );
      }

      // Clear & Seed Applications
      this.sqlite.exec('DELETE FROM applications;');
      const insertApp = this.sqlite.prepare(`
        INSERT INTO applications (id, applicationNumber, userId, userEmail, userName, userMobile, courseId, courseTitle, coursePrice, status, formData, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of data.applications || []) {
        insertApp.run(
          a.id,
          a.applicationNumber,
          a.userId,
          a.userEmail,
          a.userName,
          a.userMobile || '',
          a.courseId,
          a.courseTitle,
          a.coursePrice || 0,
          a.status || 'SUBMITTED',
          JSON.stringify(a.formData || {}),
          a.createdAt || new Date().toISOString(),
          a.updatedAt || new Date().toISOString()
        );
      }

      // Clear & Seed Payments
      this.sqlite.exec('DELETE FROM payments;');
      const insertPay = this.sqlite.prepare(`
        INSERT INTO payments (id, receiptNumber, orderId, paymentId, userId, userName, userEmail, courseId, courseTitle, applicationId, amount, currency, status, paymentMethod, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of data.payments || []) {
        insertPay.run(
          p.id,
          p.receiptNumber,
          p.orderId || '',
          p.paymentId || '',
          p.userId,
          p.userName,
          p.userEmail,
          p.courseId,
          p.courseTitle,
          p.applicationId || '',
          p.amount || 0,
          p.currency || 'INR',
          p.status || 'SUCCESS',
          p.paymentMethod || 'Razorpay',
          p.createdAt || new Date().toISOString(),
          p.updatedAt || new Date().toISOString()
        );
      }

      // Clear & Seed Sessions
      this.sqlite.exec('DELETE FROM sessions;');
      const insertSession = this.sqlite.prepare('INSERT INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)');
      if (data.sessions) {
        for (const [tok, sess] of Object.entries(data.sessions)) {
          insertSession.run(tok, sess.userId, sess.expiresAt);
        }
      }

      // Clear & Seed Verification Tokens
      this.sqlite.exec('DELETE FROM verification_tokens;');
      const insertVT = this.sqlite.prepare('INSERT INTO verification_tokens (token, email, userId, expiresAt, used) VALUES (?, ?, ?, ?, ?)');
      for (const vt of data.verificationTokens || []) {
        insertVT.run(vt.token, vt.email, vt.userId || '', vt.expiresAt, vt.used ? 1 : 0);
      }

      // Clear & Seed Password Reset Tokens
      this.sqlite.exec('DELETE FROM password_reset_tokens;');
      const insertPR = this.sqlite.prepare('INSERT INTO password_reset_tokens (token, email, userId, expiresAt, used) VALUES (?, ?, ?, ?, ?)');
      for (const pr of data.passwordResetTokens || []) {
        insertPR.run(pr.token, pr.email, pr.userId || '', pr.expiresAt, pr.used ? 1 : 0);
      }

      // Clear & Seed Notifications
      this.sqlite.exec('DELETE FROM notifications;');
      const insertNotif = this.sqlite.prepare('INSERT INTO notifications (id, userId, title, message, type, link, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const n of data.notifications || []) {
        insertNotif.run(n.id, n.userId, n.title, n.message, n.type || 'info', n.link || '', n.isRead ? 1 : 0, n.createdAt || new Date().toISOString());
      }

      // Clear & Seed Audit Logs
      this.sqlite.exec('DELETE FROM audit_logs;');
      const insertAudit = this.sqlite.prepare('INSERT INTO audit_logs (id, adminId, adminName, action, targetType, targetId, targetTitle, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const al of data.auditLogs || []) {
        insertAudit.run(al.id, al.adminId, al.adminName, al.action, al.targetType || '', al.targetId || '', al.targetTitle || '', al.createdAt || new Date().toISOString());
      }

      // Clear & Seed Project Submissions
      this.sqlite.exec('DELETE FROM project_submissions;');
      const insertProject = this.sqlite.prepare(`
        INSERT INTO project_submissions (id, userId, userName, userEmail, courseId, courseTitle, projectTitle, description, githubUrl, documentationUrl, liveDemoUrl, otherFiles, status, staffFeedback, reviewedBy, reviewedAt, submittedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of data.projectSubmissions || []) {
        insertProject.run(
          p.id,
          p.userId,
          p.userName,
          p.userEmail,
          p.courseId,
          p.courseTitle,
          p.projectTitle,
          p.description || '',
          p.githubUrl || '',
          p.documentationUrl || '',
          p.liveDemoUrl || '',
          p.otherFiles || '',
          p.status || 'PENDING_REVIEW',
          p.staffFeedback || '',
          p.reviewedBy || '',
          p.reviewedAt || '',
          p.submittedAt || new Date().toISOString(),
          p.updatedAt || new Date().toISOString()
        );
      }

      // Clear & Seed Student Progress
      this.sqlite.exec('DELETE FROM student_progress;');
      const insertProgress = this.sqlite.prepare(`
        INSERT INTO student_progress (id, userId, courseId, startDate, completedClasses, testResults, attendance, progressPercent, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const sp of data.studentProgress || []) {
        insertProgress.run(
          sp.id,
          sp.userId,
          sp.courseId,
          sp.startDate || '',
          JSON.stringify(sp.completedClasses || []),
          JSON.stringify(sp.testResults || []),
          JSON.stringify(sp.attendance || []),
          sp.progressPercent || 0,
          sp.updatedAt || new Date().toISOString()
        );
      }

      this.sqlite.exec('COMMIT;');
    } catch (err) {
      this.sqlite.exec('ROLLBACK;');
      console.error('[SQLite 3] Transaction error in persistAllToSQLite:', err);
      throw err;
    }
  }

  loadAll() {
    // Query users
    const users = this.sqlite.prepare('SELECT * FROM users').all().map((u) => ({
      ...u,
      isVerified: Boolean(u.isVerified),
      isActive: Boolean(u.isActive),
    }));

    // Query courses
    const courses = this.sqlite.prepare('SELECT * FROM courses').all().map((c) => ({
      ...c,
      featured: Boolean(c.featured),
      tags: typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : c.tags || [],
      instructor: typeof c.instructor === 'string' ? JSON.parse(c.instructor || '{}') : c.instructor || {},
      modules: typeof c.modules === 'string' ? JSON.parse(c.modules || '[]') : c.modules || [],
      learningOutcomes: typeof c.learningOutcomes === 'string' ? JSON.parse(c.learningOutcomes || '[]') : c.learningOutcomes || [],
      requirements: typeof c.requirements === 'string' ? JSON.parse(c.requirements || '[]') : c.requirements || [],
      faq: typeof c.faq === 'string' ? JSON.parse(c.faq || '[]') : c.faq || [],
      classes: typeof c.classes === 'string' ? JSON.parse(c.classes || '[]') : c.classes || getDefaultClassesForCourse(c.id, c.title),
    }));

    // Query applications
    const applications = this.sqlite.prepare('SELECT * FROM applications').all().map((a) => ({
      ...a,
      formData: typeof a.formData === 'string' ? JSON.parse(a.formData || '{}') : a.formData || {},
    }));

    // Query payments
    const payments = this.sqlite.prepare('SELECT * FROM payments').all();

    // Query sessions
    const sessions = {};
    const sessionRows = this.sqlite.prepare('SELECT * FROM sessions').all();
    for (const s of sessionRows) {
      sessions[s.token] = { userId: s.userId, expiresAt: s.expiresAt };
    }

    // Query tokens & logs
    const verificationTokens = this.sqlite.prepare('SELECT * FROM verification_tokens').all().map((vt) => ({
      ...vt,
      used: Boolean(vt.used),
    }));
    const passwordResetTokens = this.sqlite.prepare('SELECT * FROM password_reset_tokens').all().map((pr) => ({
      ...pr,
      used: Boolean(pr.used),
    }));
    const notifications = this.sqlite.prepare('SELECT * FROM notifications').all().map((n) => ({
      ...n,
      isRead: Boolean(n.isRead),
    }));
    const auditLogs = this.sqlite.prepare('SELECT * FROM audit_logs').all();
    const emailRecords = this.sqlite.prepare('SELECT * FROM email_records').all();

    // Query project submissions
    let projectSubmissions = [];
    try {
      projectSubmissions = this.sqlite.prepare('SELECT * FROM project_submissions').all();
    } catch(e) {
      projectSubmissions = [];
    }

    // Query student progress
    let studentProgress = [];
    try {
      studentProgress = this.sqlite.prepare('SELECT * FROM student_progress').all().map((sp) => ({
        ...sp,
        completedClasses: typeof sp.completedClasses === 'string' ? JSON.parse(sp.completedClasses || '[]') : sp.completedClasses || [],
        testResults: typeof sp.testResults === 'string' ? JSON.parse(sp.testResults || '[]') : sp.testResults || [],
        attendance: typeof sp.attendance === 'string' ? JSON.parse(sp.attendance || '[]') : sp.attendance || [],
      }));
    } catch(e) {
      studentProgress = [];
    }

    return {
      users,
      courses,
      applications,
      payments,
      sessions,
      verificationTokens,
      passwordResetTokens,
      notifications,
      auditLogs,
      emailRecords,
      projectSubmissions,
      studentProgress,
    };
  }


  save(data) {
    const target = data || this.raw;
    this.persistAllToSQLite(target);
    this.raw = this.loadAll();

    // Also persist data.json backup atomically
    try {
      const tmpFile = DATA_FILE + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(this.raw, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (e) {
      console.warn('Backup save warning:', e.message);
    }
  }

  async transaction(fn) {
    const result = await fn(this.raw);
    this.save(this.raw);
    return result;
  }
}

export const db = new SQLiteDatabase();
