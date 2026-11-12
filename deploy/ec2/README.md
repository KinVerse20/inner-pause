# Running Inner Pause on EC2

One Ubuntu 24.04 server runs both apps under `theinnerpause.com`:

```
browser ──HTTPS──> Caddy :443 ──> Next.js :3000 ──/api/*──> backend :4000
                                                              │
                                     MongoDB Atlas <──────────┤
                              S3 theinnerpause-files-… <──────┘
```

- AWS account `735381631291`, region `ap-south-1` (Mumbai). Locally the AWS
  CLI uses the `innerpause` profile (`--profile innerpause`).
- Uploaded sounds, covers and renders go to the private S3 bucket
  `theinnerpause-files-735381631291`. The server reaches it via its IAM role
  `innerpause-ec2`, so it doesn't need access keys.
- Settings live on the server in `/opt/innerpause/.env`. See
  `env.production.example`.

## 1. IAM role (account administrator, once)

The `deploy` user can't use IAM. Someone with administrator access runs this
from this folder:

```
aws iam create-role --role-name innerpause-ec2 --assume-role-policy-document file://iam/trust-policy.json
aws iam put-role-policy --role-name innerpause-ec2 --policy-name s3-files --policy-document file://iam/s3-files-policy.json
aws iam create-instance-profile --instance-profile-name innerpause-ec2
aws iam add-role-to-instance-profile --instance-profile-name innerpause-ec2 --role-name innerpause-ec2
aws iam put-user-policy --user-name deploy --policy-name pass-innerpause-ec2 --policy-document file://iam/deploy-user-passrole-policy.json
```

Until the role is attached, leave `S3_BUCKET` empty. Sounds are then kept on
the server's disk in `/opt/innerpause/uploads`. To switch to S3 afterwards:

```
aws ec2 associate-iam-instance-profile --instance-id <id> --iam-instance-profile Name=innerpause-ec2
# on the server:
sudo snap install aws-cli --classic
sudo aws s3 sync /opt/innerpause/uploads s3://theinnerpause-files-735381631291/inner-pause/
# set S3_BUCKET=theinnerpause-files-735381631291 in /opt/innerpause/.env, then
sudo systemctl restart innerpause-api
```

## 2. Server

Launch a `t4g.micro` (ARM, 1 GB of memory, the cheapest size that runs the
app) from the Ubuntu 24.04 **arm64** image with:

- a 12 GB gp3 disk
- the instance profile `innerpause-ec2`
- a security group open on 80 and 443 to everyone, and on 22 only to your IP
- an Elastic IP

Then copy this folder up and run the setup:

```
scp -i ~/.ssh/innerpause.pem -r deploy/ec2 ubuntu@<ip>:setup
ssh -i ~/.ssh/innerpause.pem ubuntu@<ip> "sudo bash setup/setup-server.sh"
```

Fill in `/opt/innerpause/.env` on the server:

```
sudo -u innerpause nano /opt/innerpause/.env
```

## 3. DNS (at your domain registrar)

| Type | Name | Value |
|------|------|-------|
| A | `@` | the Elastic IP |
| A | `www` | the Elastic IP |

Caddy gets the HTTPS certificates once these records point at the server.

## 4. Deploy

From the repo root, in Git Bash. This ships the committed code:

```
DEPLOY_HOST=<ip> bash deploy/ec2/deploy.sh
```

On 1 GB the build leans on swap and takes a few minutes, and the live app
can slow down while it runs. If the app runs short of memory, change the
server to `t4g.small` (2 GB): stop the server, change its instance type, then
start it again.

Logs:

```
journalctl -u innerpause-api -f
journalctl -u innerpause-web -f
```
