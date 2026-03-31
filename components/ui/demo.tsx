import * as React from "react";

import TravelConnectSignIn1 from "@/components/ui/travel-connect-signin-1";

type DemoTravelConnectSignInProps = React.ComponentProps<
  typeof TravelConnectSignIn1
>;

function DemoTravelConnectSignIn(props: DemoTravelConnectSignInProps) {
  return <TravelConnectSignIn1 {...props} />;
}

export { DemoTravelConnectSignIn };
