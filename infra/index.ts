import * as gcp from '@pulumi/gcp';
import {Output} from '@pulumi/pulumi';
import {
  CloudRunAccess,
  config, createCloudRunService, createEnvVarsFromSecret,
  createK8sServiceAccountFromGCPServiceAccount, createMigrationJob,
  createServiceAccountAndGrantRoles, createSubscriptionsFromWorkers,
  imageTag, infra, k8sServiceAccountToIdentity
} from "@dailydotdev/pulumi-common";

const name = 'gateway';

const vpcConnector = infra.getOutput('serverlessVPC') as Output<gcp.vpcaccess.Connector>;

const {serviceAccount} = createServiceAccountAndGrantRoles(
  `${name}-sa`,
  name,
  `daily-${name}`,
  [
    {name: 'profiler', role: 'roles/cloudprofiler.agent'},
    {name: 'trace', role: 'roles/cloudtrace.agent'},
    {name: 'secret', role: 'roles/secretmanager.secretAccessor'},
    {name: 'pubsub', role: 'roles/pubsub.editor'},
  ],
);

const secrets = createEnvVarsFromSecret(name);

const image = `gcr.io/daily-ops/daily-${name}:${imageTag}`;

// Create K8S service account and assign it to a GCP service account
const {namespace} = config.requireObject<{
  namespace: string;
  host: string;
}>('k8s');

const k8sServiceAccount = createK8sServiceAccountFromGCPServiceAccount(
  `${name}-k8s-sa`,
  name,
  namespace,
  serviceAccount,
);

new gcp.serviceaccount.IAMBinding(`${name}-k8s-iam-binding`, {
  role: 'roles/iam.workloadIdentityUser',
  serviceAccountId: serviceAccount.id,
  members: [k8sServiceAccountToIdentity(k8sServiceAccount)],
});

const migrationJob = createMigrationJob(
  `${name}-migration`,
  namespace,
  image,
  ['yarn', 'run', 'db:migrate:latest'],
  secrets,
  k8sServiceAccount,
);

// Deploy to Cloud Run (foreground & background)
const service = createCloudRunService(
  name,
  image,
  secrets,
  {cpu: '1', memory: '512Mi'},
  vpcConnector,
  serviceAccount,
  {
    minScale: 1,
    concurrency: 250,
    dependsOn: [migrationJob],
    access: CloudRunAccess.Public,
    iamMemberName: `${name}-public`,
  },
);

const bgService = createCloudRunService(
  `${name}-background`,
  image,
  [...secrets, {name: 'MODE', value: 'background'}],
  {cpu: '1', memory: '256Mi'},
  vpcConnector,
  serviceAccount,
  {
    dependsOn: [migrationJob],
    access: CloudRunAccess.PubSub,
    iamMemberName: `${name}-pubsub-invoker`,
  },
);

export const serviceUrl = service.statuses[0].url;
export const bgServiceUrl = bgService.statuses[0].url;

const workers = [
  {topic: 'user-updated', subscription: 'user-updated-mailing'},
  {topic: 'user-registered', subscription: 'user-registered-slack'},
  {topic: 'user-reputation-updated', subscription: 'update-reputation'},
  {topic: 'user-registered', subscription: 'user-registered-referral-contest'},
  {topic: 'new-eligible-participant', subscription: 'new-eligible-participant-notification'},
  {topic: 'new-eligible-participant', subscription: 'new-eligible-participant-boost-chances'},
]

createSubscriptionsFromWorkers(name, workers, bgServiceUrl);
