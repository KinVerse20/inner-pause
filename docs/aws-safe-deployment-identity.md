# Safe AWS deployment identity

Use the AWS root user only for initial account setup. Do not use root for daily deployment work.

## Recommended path: IAM Identity Center

If AWS IAM Identity Center is available:

1. Sign in as the AWS root user only long enough to set up account security.
2. Enable MFA on the root user.
3. Do not create root access keys.
4. Open IAM Identity Center.
5. Create a user for deployment work.
6. Assign that user a permission set for CDK setup and test deployment.
7. Use temporary SSO login from the AWS CLI.
8. After the first test deployment, reduce permissions to only what is needed for future updates.

This is preferred because it avoids permanent access keys.

## Alternative path: controlled IAM deployment user or role

If IAM Identity Center is not practical for one test account:

1. Sign in as root only for setup.
2. Enable MFA on the root user.
3. Create a separate IAM user or deployment role.
4. Give broad CDK permissions only temporarily if bootstrap requires it.
5. Do not keep permanent `AdministratorAccess`.
6. After bootstrap and first review, reduce permissions.
7. Rotate or delete any temporary access keys.

## What not to do

- Do not use root user credentials for deployment.
- Do not create root access keys.
- Do not paste AWS access keys into GitHub.
- Do not paste AWS access keys into frontend code.
- Do not paste AWS access keys into chat.
- Do not commit `.env` files with real values.

## Why CDK may need broad temporary permissions

The first CDK bootstrap can create IAM roles, an asset bucket and deployment support resources. That may require broader permissions than normal app updates.

Use broader access only for setup if needed. Remove or reduce it afterwards.

## Revoking the deployment identity later

For IAM Identity Center:

1. Remove the permission set assignment.
2. Disable the user if it is no longer needed.

For IAM access keys:

1. Open IAM.
2. Find the deployment user.
3. Deactivate the access key.
4. Delete the access key after confirming nothing depends on it.
5. Remove unnecessary policies.

