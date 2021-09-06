#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import { CdkStackSveltekit } from '../lib/cdk-stack-sveltekit';

const namespace = process.env.CDK_NAMESPACE!;
const domainName = process.env.CDK_DOMAINNAME!;
const hostedZoneId = process.env.CDK_HOSTEDZONEID!;
const awsRegion = process.env.CDK_AWSREGION!;
const awsAccount = process.env.CDK_AWSACCOUNT!;

const app = new App({
  context: {
    [`hosted-zone:account=${awsAccount}:domainName=${domainName}:region=${awsRegion}`]: {
      Id: `/hostedzone/${hostedZoneId}`,
      Name: `${domainName}.`,
    },
  },
});

new CdkStackSveltekit(app, 'CdkStackSveltekitStack', {
  namespace,
  domainName,
  hostName: 'abcdef',
  serverPath: 'example/.svelte-kit/output/server-bundle',
  staticPath: 'example/.svelte-kit/output/static',
  env: { account: awsAccount, region: awsRegion },
});
