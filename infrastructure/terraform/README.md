# Terraform — placeholder

Deliberately not a working IaC setup yet. Provisioning real infrastructure (cloud
provider, account, state backend, networking) is a Phase 5+ decision in
`docs/MVP_ROADMAP.md`, and depends on choices this repo hasn't made yet (which cloud,
which account, which region). Writing a full Terraform setup against an undetermined
target would just be fiction.

`versions.tf` only pins the Terraform/provider version constraints so that whoever makes
that decision has a starting point, not a working `terraform apply`.
