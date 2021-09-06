import { StackProps, Construct, Stack } from '@aws-cdk/core';

interface CdkStackSveltekitProps extends StackProps {}

export class CdkStackSveltekit extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackSveltekitProps) {
    super(scope, id, props);
  }
}
