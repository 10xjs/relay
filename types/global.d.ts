type Nullable<T> = T | null | undefined;

type ResolveType<T> = T extends Promise<infer R>
  ? R extends Promise<any>
    ? ResolveType<R>
    : R
  : T;

interface CognitoAuthorizerContext {
  iam: {
    accessKey: string;
    accountId: string;
    callerId: string;
    cognitoIdentity: {
      /** Authentication Methods References */
      amr: string[];
      identityId: string;
      identityPoolId: string;
    };
    principalOrgId: string | null;
    userArn: string;
    userId: string;
  };
}
