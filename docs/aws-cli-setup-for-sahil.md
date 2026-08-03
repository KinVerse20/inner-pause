# AWS CLI setup for Sahil

Use this only for the isolated AWS test account.

## 1. Install AWS CLI on macOS

If Homebrew is installed:

```bash
brew install awscli
```

Or use the official AWS macOS installer from AWS documentation.

## 2. Confirm installation

```bash
aws --version
```

## 3. Sign in with the deployment identity

Preferred SSO setup:

```bash
aws configure sso
```

Follow the browser login prompts.

If using a controlled IAM access key, configure it locally:

```bash
aws configure
```

Use placeholders only in notes. Do not save credentials in this repository.

## 4. Configure Mumbai region

```bash
aws configure set region ap-south-1
```

## 5. Verify identity

From the project root:

```bash
cd "/Users/sahil/Documents/Healing App"
npm run aws:verify
```

This prints:

- AWS account ID
- current identity ARN
- selected region

It does not print access keys or secrets.

## 6. Confirm root user is not active

The verify script stops if the ARN ends with `:root`.

If that happens, do not continue. Configure IAM Identity Center or a deployment user/role.

## 7. Clear wrong credentials

If the wrong account is connected:

```bash
aws configure list
```

Then remove or replace the wrong local profile credentials. For standard local credentials, check:

```bash
ls ~/.aws
```

Do not paste the contents into chat or source code.

