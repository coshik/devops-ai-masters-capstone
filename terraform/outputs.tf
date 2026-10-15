output "cluster_name" {
  value = data.aws_eks_cluster.existing.name
}

output "cluster_status" {
  value = data.aws_eks_cluster.existing.status
}

output "cluster_version" {
  value = data.aws_eks_cluster.existing.version
}

output "vpc_id" {
  value = data.aws_vpc.cluster.id
}

output "subnet_ids" {
  value = data.aws_subnets.cluster.ids
}

output "nodegroup_instance_types" {
  value = data.aws_eks_node_group.existing.instance_types
}

output "nodegroup_scaling" {
  value = data.aws_eks_node_group.existing.scaling_config
}

output "controller_role_arn" {
  value = data.aws_iam_role.controller.arn
}

output "nodegroup_role_arn" {
  value = data.aws_iam_role.nodegroup.arn
}
