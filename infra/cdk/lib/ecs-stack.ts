import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

import { PORT_MAPPING, REPOSITORIES } from "@adh/types";

import { env } from "../env";

export class EcsStack extends cdk.Stack {
  public readonly apiServiceDnsName: string;
  public readonly expertServiceDnsName: string;
  constructor(
    scope: Construct,
    id: string,
    environment: typeof env.NEXT_PUBLIC_CDK_ENVIRONMENT,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, `${id}-vpc`, {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      vpcName: `${id}-vpc-${environment}`,
      restrictDefaultSecurityGroup: false,
    });

    const cluster: ecs.Cluster = new ecs.Cluster(this, `${id}-cluster`, {
      vpc,
      clusterName: `${id}-cluster-${environment}`,
    });

    const hostedZone = route53.HostedZone.fromLookup(
      this,
      `${id}-hosted-zone`,
      {
        domainName: env.NEXT_PUBLIC_BASE_DOMAIN,
      },
    );

    const services = REPOSITORIES.map((repoName) => {
      const repository = ecr.Repository.fromRepositoryName(
        this,
        `${id}-${repoName}-ecr`,
        repoName,
      );
      const serviceName = repoName.replace("adh-", "");
      const applicationService = new ApplicationService(
        this,
        `${id}-${serviceName}`,
        serviceName,
        PORT_MAPPING[repoName],
        repository,
        environment,
        cluster,
        hostedZone,
      );
      return {
        name: serviceName,
        serviceUrl: applicationService.serviceUrl,
      };
    });

    this.apiServiceDnsName = services.find((service) => service.name === "api")
      ?.serviceUrl as string;
    this.expertServiceDnsName = services.find(
      (service) => service.name === "expert",
    )?.serviceUrl as string;
  }
}

class ApplicationService extends cdk.NestedStack {
  public readonly serviceUrl: string;
  constructor(
    scope: Construct,
    id: string,
    serviceName: string,
    port: number,
    repository: ecr.IRepository,
    environment: typeof env.NEXT_PUBLIC_NODE_ENV,
    cluster: ecs.Cluster,
    hostedZone: route53.IHostedZone,
    props?: cdk.NestedStackProps,
  ) {
    super(scope, id, props);

    const domainName = `${environment === "production" ? "" : environment + "."}app.${env.NEXT_PUBLIC_BASE_DOMAIN}`;

    const certificate = new acm.Certificate(this, `${id}-certificate`, {
      domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const service = new ApplicationLoadBalancedFargateService(this, id, {
      serviceName: id,
      loadBalancerName: `${id}-alb`,
      cluster,
      memoryLimitMiB: 512,
      cpu: 256,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository, environment),
        environment: {
          ...env,
        },
        containerName: serviceName,
        containerPort: port,
      },
      protocol: ApplicationProtocol.HTTPS,
      certificate: certificate,
      redirectHTTP: true,
      desiredCount: 1,
      publicLoadBalancer: true,
      domainName,
      domainZone: hostedZone,
    });

    repository.grantPull(service.taskDefinition.taskRole);

    service.targetGroup.configureHealthCheck({
      path: "/health",
    });

    const scaling = service.service.autoScaleTaskCount({
      maxCapacity: 5,
      minCapacity: 1,
    });
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 80,
    });
    scaling.scaleOnMemoryUtilization("RamScaling", {
      targetUtilizationPercent: 70,
    });

    this.serviceUrl = service.loadBalancer.loadBalancerDnsName;

    new cdk.CfnOutput(this, "ServiceUrl", {
      value: service.loadBalancer.loadBalancerDnsName,
    });
  }
}
