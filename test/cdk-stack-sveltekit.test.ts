import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { CdkStackSveltekit } from '../lib/cdk-stack-sveltekit';

test('Empty Stack', () => {
  const app = new App();
  // WHEN
  const stack = new CdkStackSveltekit(app, 'MyTestStack', {
    namespace: '',
    serverPath: '',
    staticPath: '',
    domainName: '',
    hostName: '',
  });
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
