#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { CdkStackSveltekit } from '../lib/cdk-stack-sveltekit';

const domainName = process.env.DOMAINNAME || '';
const certificateArn = process.env.AWS_CERTIFICATEARN || '';
const hostedZoneId = process.env.AWS_HOSTEDZONEID;
const awsRegion = process.env.AWS_REGION;
const awsAccount = process.env.AWS_ACCOUNT;

const app = new App({
  context: {
    [`hosted-zone:account=${awsAccount}:domainName=${domainName}:region=${awsRegion}`]: {
      Id: `/hostedzone/${hostedZoneId}`,
      Name: `${domainName}.`,
    },
  },
});

new CdkStackSveltekit(app, 'CdkStackSveltekitStack', {
  env: { account: awsAccount, region: awsRegion },
});
