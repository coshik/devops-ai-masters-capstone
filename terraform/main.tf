data "aws_eks_cluster" "existing" {
  name = var.cluster_name
}

data "aws_eks_node_group" "existing" {
  cluster_name    = var.cluster_name
  node_group_name = var.nodegroup_name
}

data "aws_vpc" "cluster" {
  id = data.aws_eks_cluster.existing.vpc_config[0].vpc_id
}

data "aws_subnets" "cluster" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.cluster.id]
  }
}

data "aws_iam_role" "controller" {
  name = var.controller_role_name
}

data "aws_iam_role" "nodegroup" {
  name = element(
    split("/", data.aws_eks_node_group.existing.node_role_arn),
    length(split("/", data.aws_eks_node_group.existing.node_role_arn)) - 1
  )
}

resource "aws_cloudwatch_log_group" "eks_control_plane" {
  name              = "/aws/eks/devops-ai-capstone/cluster"
  retention_in_days = 7

  tags = {
    Project     = "devops-ai-masters-capstone"
    Environment = "capstone"
    ManagedBy   = "Terraform"
  }
}
