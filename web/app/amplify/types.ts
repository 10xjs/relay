export interface AmplifyConfig {
  ssr?: boolean;
  Auth: {
    /** Amazon Cognito Identity Pool ID */
    identityPoolId?: string;
    /** Amazon Cognito Region */
    region: string;
    /** Amazon Cognito Federated Identity Pool Region */
    identityPoolRegion?: string;
    /** Amazon Cognito User Pool ID */
    userPoolId?: string;
    /** Amazon Cognito Web Client ID (26-char alphanumeric string, App client secret needs to be disabled) */
    userPoolWebClientId?: string;
    /** Enforce user authentication prior to accessing AWS resources or not */
    mandatorySignIn?: boolean;
    /** Configuration for cookie storage */
    cookieStorage?: {
      /**
       * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.3|Domain Set-Cookie attribute}. By default, no
       * domain is set, and most clients will consider the cookie to apply to only
       * the current domain.
       */
      domain?: string;
      /**
       * Cookie expiration in days.
       */
      expires?: number;
      /**
       * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.6|`HttpOnly` `Set-Cookie` attribute}.
       * When truthy, the `HttpOnly` attribute is set, otherwise it is not. By
       * default, the `HttpOnly` attribute is not set.
       *
       * *Note* be careful when setting this to true, as compliant clients will
       * not allow client-side JavaScript to see the cookie in `document.cookie`.
       */
      httpOnly?: boolean;
      /**
       * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.4|`Path` `Set-Cookie` attribute}.
       * By default, the path is considered the "default path".
       */
      path?: string;
      /**
       * Specifies the boolean or string to be the value for the {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|`SameSite` `Set-Cookie` attribute}.
       *
       * - `true` will set the `SameSite` attribute to `Strict` for strict same
       * site enforcement.
       * - `false` will not set the `SameSite` attribute.
       * - `'lax'` will set the `SameSite` attribute to Lax for lax same site
       * enforcement.
       * - `'strict'` will set the `SameSite` attribute to Strict for strict same
       * site enforcement.
       *  - `'none'` will set the SameSite attribute to None for an explicit
       *  cross-site cookie.
       *
       * More information about the different enforcement levels can be found in {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|the specification}.
       *
       * *note* This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.
       */
      sameSite?: true | false | "lax" | "strict" | "none";
      /**
       * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.5|`Secure` `Set-Cookie` attribute}. When truthy, the
       * `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.
       *
       * *Note* be careful when setting this to `true`, as compliant clients will
       * not send the cookie back to the server in the future if the browser does
       * not have an HTTPS connection.
       */
      secure?: boolean;
    };
    /** Customized storage object */
    storage?: Storage;
    /**  Manually set the authentication flow type. Default is 'USER_SRP_AUTH' */
    authenticationFlowType?:
      | "USER_PASSWORD_AUTH"
      | "USER_SRP_AUTH"
      | "CUSTOM_AUTH";
    /**  Manually set key value pairs that can be passed to Cognito Lambda Triggers */
    clientMetadata?: { [key: string]: string };
    /** Hosted UI configuration */
    oauth?: {
      domain?: string;
      scope?: string[];
      redirectUri?: string;
      redirectSignIn?: string;
      redirectSignOut?: string;
      clientId?: string;
      responseType?: "code" | "token";
    };
  };
  API?: {
    headers?: { [key: string]: any };
    endpoints: {
      name: string;
      endpoint: string;
      service?: string;
      region?: string;
    }[];
    credentials?: any;
  };
  Credentials?: {
    refreshHandlers: {
      [key: string]: () => Promise<{ token: string; expires_at: number }>;
    };
    storage?: Storage;
    userPoolId: string;
    identityPoolId: string;
    region: string;
    mandatorySignIn?: boolean;
  };
}
