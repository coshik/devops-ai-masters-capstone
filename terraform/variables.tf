variable "aws_region" {
  description = "AWS region hosting the capstone infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "cluster_name" {
  description = "Name of the existing EKS cluster"
  type        = string
  default     = "devops-ai-capstone"
}

variable "nodegroup_name" {
  description = "Name of the existing EKS managed node group"
  type        = string
  default     = "capstone-ng"
}

variable "controller_role_name" {
  description = "Name of the existing EC2 controller IAM role"
  type        = string
  default     = "devops-capstone-controller-role"
}
