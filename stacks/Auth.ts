import {
  Auth as SstAuth,
  Function,
  StackContext,
  use,
} from "@serverless-stack/resources";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import {
  ClientAttributes,
  ProviderAttribute,
  UserPool,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderFacebook,
  UserPoolIdentityProviderGoogle,
  UserPoolOperation,
} from "aws-cdk-lib/aws-cognito";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { AaaaRecord, ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { UserPoolDomainTarget } from "aws-cdk-lib/aws-route53-targets";
import { Dns } from "./Dns";
import { get } from "./env";

export function Auth({ app, stack }: StackContext) {
  const { zone, rootDomain } = use(Dns);

  const callbackPaths = ["/login"];
  const logoutPaths = [""];

  const webHosts: string[] = [];

  if (rootDomain) {
    webHosts.push(`https://${rootDomain}`);
  }

  if (app.stage !== "staging" && app.stage !== "production") {
    webHosts.push(`http://localhost:3000`);
  }

  const auth = new SstAuth(stack, "Auth", {
    cdk: {
      userPool: {
        selfSignUpEnabled: false,
        standardAttributes: {
          email: {
            required: true,
          },
        },
        passwordPolicy: {},
      },
      userPoolClient: {
        supportedIdentityProviders: [
          // UserPoolClientIdentityProvider.COGNITO,
          UserPoolClientIdentityProvider.GOOGLE,
          UserPoolClientIdentityProvider.FACEBOOK,
        ],
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          callbackUrls: callbackPaths.flatMap((path) => {
            return webHosts.map((host) => {
              return `${host}${path}`;
            });
          }),
          logoutUrls: logoutPaths.flatMap((path) => {
            return webHosts.map((host) => {
              return `${host}${path}`;
            });
          }),
        },
        readAttributes: new ClientAttributes().withStandardAttributes({
          email: true,
          locale: true,
          fullname: true,
          profilePicture: true,
          preferredUsername: true,
          emailVerified: true,
        }),
        writeAttributes: new ClientAttributes().withStandardAttributes({
          // locale: true,
          // fullname: true,
          // profilePicture: true,
          // preferredUsername: true,
        }),
      },
    },
  });

  let authDomain;

  if (rootDomain) {
    authDomain = `auth.${rootDomain}`;

    const certificate = new Certificate(stack, "Certificate", {
      domainName: authDomain,
      validation: CertificateValidation.fromDns(zone),
    });

    const userPoolDomain = auth.cdk.userPool.addDomain("Domain", {
      customDomain: {
        domainName: authDomain,
        certificate,
      },
    });

    new ARecord(stack, "ARecord", {
      zone,
      recordName: authDomain,
      target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPoolDomain)),
    });
    new AaaaRecord(stack, "AaaaRecord", {
      zone,
      recordName: authDomain,
      target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPoolDomain)),
    });
  } else {
    const userPoolDomain = auth.cdk.userPool.addDomain("Domain", {
      cognitoDomain: {
        domainPrefix: get("COGNITO_DOMAIN_PREFIX"),
      },
    });

    authDomain = userPoolDomain.baseUrl();
  }

  const googleProvider = new UserPoolIdentityProviderGoogle(
    stack,
    "GoogleProvider",
    {
      userPool: auth.cdk.userPool,
      clientId: get("GOOGLE_CLIENT_ID"),
      clientSecret: get("GOOGLE_CLIENT_SECRET"),
      scopes: ["openid", "profile", "email"],
      attributeMapping: {
        email: ProviderAttribute.GOOGLE_EMAIL,
        profilePicture: ProviderAttribute.GOOGLE_PICTURE,
        fullname: ProviderAttribute.GOOGLE_NAME,
        custom: {
          email_verified: ProviderAttribute.other("email_verified"),
        },
      },
    }
  );

  auth.cdk.userPoolClient.node.addDependency(googleProvider);

  const facebookProvider = new UserPoolIdentityProviderFacebook(
    stack,
    "FacebookProvider",
    {
      userPool: auth.cdk.userPool,
      clientId: get("FACEBOOK_APP_ID"),
      clientSecret: get("FACEBOOK_APP_SECRET"),
      scopes: ["openid", "public_profile", "email"],
      attributeMapping: {
        email: ProviderAttribute.FACEBOOK_EMAIL,
        profilePicture: ProviderAttribute.other("picture"),
        fullname: ProviderAttribute.FACEBOOK_NAME,
      },
      apiVersion: "v14.0",
    }
  );

  auth.cdk.userPoolClient.node.addDependency(facebookProvider);

  stack.addOutputs({
    authDomain,
  });

  return { auth, authDomain };
}
