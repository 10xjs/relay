import type { StackContext } from "@serverless-stack/resources";
import type ec2 from "aws-cdk-lib/aws-ec2";
import elasticloadbalancingv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

import type { KratosService } from "./Service";

export interface KratosLoadBalancerProps {
  vpc: ec2.Vpc;
  service: KratosService;
}

export class KratosLoadBalancer extends elasticloadbalancingv2.ApplicationLoadBalancer {
  readonly publicListener;
  readonly adminListener;

  constructor(
    context: StackContext,
    id: string,
    readonly props: KratosLoadBalancerProps
  ) {
    // const loadBalancerDomain = `elb.${authDomain}`;

    // const loadBalancerCertificate = new certificatemanager.Certificate(
    //   stack,
    //   "elb-certificate",
    //   {
    //     domainName: loadBalancerDomain,
    //     validation: certificatemanager.CertificateValidation.fromDns(zone),
    //   }
    // );

    super(context.stack, id, {
      vpc: props.vpc,
      internetFacing: true,
    });

    this.publicListener = this.createPublicListener();

    this.adminListener = this.createAdminListener();
  }

  createPublicListener() {
    const listener = this.addListener("PublicListener", {
      // protocol: elasticloadbalancingv2.ApplicationProtocol.HTTPS,
      protocol: elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: this.props.service.taskDefinition.publicPort,
      open: true,
      // certificates: [loadBalancerCertificate],
      // sslPolicy: elasticloadbalancingv2.SslPolicy.RECOMMENDED
    });

    listener.addTargets("PublicTargets", {
      protocol: elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: this.props.service.taskDefinition.publicPort,
      healthCheck: {
        port: String(this.props.service.taskDefinition.publicPort),
        path: "/health/alive",
      },
      targets: [this.props.service],
    });
  }

  createAdminListener() {
    const listener = this.addListener("AdminListener", {
      // protocol: elasticloadbalancingv2.ApplicationProtocol.HTTPS,
      protocol: elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: this.props.service.taskDefinition.adminPort,
      open: false,
      // certificates: [loadBalancerCertificate],
      // sslPolicy: elasticloadbalancingv2.SslPolicy.RECOMMENDED
    });

    listener.addTargets("AdminTargets", {
      protocol: elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: this.props.service.taskDefinition.adminPort,
      healthCheck: {
        port: String(this.props.service.taskDefinition.adminPort),
        path: "/admin/health/alive",
      },
      targets: [this.props.service],
    });
  }
}
