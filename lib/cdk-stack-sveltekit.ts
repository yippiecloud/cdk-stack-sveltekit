import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { StackProps, Construct, Stack, Fn, CfnOutput } from '@aws-cdk/core';
import { Function, AssetCode, Runtime } from '@aws-cdk/aws-lambda';
import { HttpApi, HttpMethod, PayloadFormatVersion } from '@aws-cdk/aws-apigatewayv2';
import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import {
  OriginAccessIdentity,
  CloudFrontWebDistribution,
  OriginProtocolPolicy,
  PriceClass,
  CloudFrontAllowedMethods,
  Behavior,
  ViewerProtocolPolicy,
} from '@aws-cdk/aws-cloudfront';
import { ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { HostedZone } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';

interface CdkStackSveltekitProps extends StackProps {
  namespace: string;
  serverPath: string;
  staticPath: string;
  domainName: string;
  hostName: string;
}

export class CdkStackSveltekit extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackSveltekitProps) {
    super(scope, id, props);

    const { serverPath, staticPath, namespace, domainName, hostName } = props;

    const handler = new Function(this, 'LambdaFunctionHandler', {
      code: new AssetCode(serverPath),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 128,
    });

    const api = new HttpApi(this, 'API');
    api.addRoutes({
      path: '/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new LambdaProxyIntegration({
        handler,
        payloadFormatVersion: PayloadFormatVersion.VERSION_1_0,
      }),
    });

    const staticBucket = new Bucket(this, 'StaticContentBucket');

    const staticID = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    staticBucket.grantRead(staticID);

    const zone = HostedZone.fromLookup(this, 'DNSZone', { domainName });

    const certificate = new DnsValidatedCertificate(this, 'Certificate', {
      domainName: `${hostName}.${domainName}`,
      hostedZone: zone,
      region: 'us-east-1',
    });

    const distribution = new CloudFrontWebDistribution(this, 'CloudFrontWebDistribution', {
      aliasConfiguration: {
        names: [`${hostName}.${domainName}`],
        acmCertRef: certificate.certificateArn,
      },
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultRootObject: '',
      originConfigs: [
        {
          customOriginSource: {
            domainName: Fn.select(1, Fn.split('://', api.apiEndpoint)),
            originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
          },
          behaviors: [
            {
              allowedMethods: CloudFrontAllowedMethods.ALL,
              forwardedValues: {
                queryString: true,
                cookies: {
                  forward: 'all',
                },
              },
              isDefaultBehavior: true,
            },
          ],
        },
        {
          s3OriginSource: {
            s3BucketSource: staticBucket,
            originAccessIdentity: staticID,
          },
          behaviors: mkStaticRoutes(props.staticPath),
        },
      ],
    });

    new BucketDeployment(this, 'StaticContentDeployment', {
      destinationBucket: staticBucket,
      sources: [Source.asset(staticPath)],
      retainOnDelete: false,
      prune: true,
      distribution,
      distributionPaths: ['/*'],
    });

    const record = new ARecord(this, 'AliasRecord', {
      zone,
      recordName: `${hostName}.${domainName}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    new CfnOutput(this, `AliasRecord-DomainName`, {
      value: record.domainName,
    });
  }
}

function mkStaticRoutes(staticPath: string): Behavior[] {
  return readdirSync(staticPath).map((f) => {
    const fullPath = join(staticPath, f);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      return {
        pathPattern: `/${f}/*`,
      };
    }
    return { pathPattern: `/${f}` };
  });
}
