import { useEffect } from "react";
import SuperTokens from "supertokens-auth-react";
import { redirectToAuth } from "supertokens-auth-react/recipe/thirdpartypasswordless";

const SuperTokensComponent =
  typeof window !== "undefined" ? SuperTokens.getRoutingComponent : () => null;

export default function Auth() {
  useEffect(() => {
    if (SuperTokens.canHandleRoute() === false) {
      redirectToAuth();
    }
  }, []);

  return (
    <div>
      <SuperTokensComponent />
    </div>
  );
}
