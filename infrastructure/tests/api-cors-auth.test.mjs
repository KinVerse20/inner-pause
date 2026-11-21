import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const amplifyOrigin = "https://feature-aws-account-setup.d3mrns75cpzj85.amplifyapp.com";
const template = JSON.parse(fs.readFileSync("cdk.out/InnerPauseAwsTestStack.template.json", "utf8"));
const resources = Object.values(template.Resources);

test("protected API routes use Cognito while OPTIONS remains unauthenticated", () => {
  const methods = resources.filter((resource) => resource.Type === "AWS::ApiGateway::Method");
  const protectedPaths = [
    "/Default/api/v1/{proxy+}/ANY/Resource",
    "/Default/api/v1/analysis/quick/POST/Resource",
    "/Default/api/v1/journals/{journalId}/analyse/POST/Resource",
    "/Default/api/v1/journals/{journalId}/reset-audio/POST/Resource",
    "/Default/api/v1/admin/{proxy+}/ANY/Resource",
  ];

  for (const suffix of protectedPaths) {
    const method = methods.find((resource) => resource.Metadata?.["aws:cdk:path"]?.endsWith(suffix));
    assert.ok(method, `Missing API method ${suffix}`);
    assert.equal(method.Properties.AuthorizationType, "COGNITO_USER_POOLS");
  }

  const options = methods.filter((resource) => resource.Properties.HttpMethod === "OPTIONS");
  assert.ok(options.length > 0);
  assert.ok(options.every((resource) => resource.Properties.AuthorizationType === "NONE"));
});

test("gateway-generated 401, 403, 4xx and 5xx responses allow the Amplify origin", () => {
  const gatewayResponses = resources.filter((resource) => resource.Type === "AWS::ApiGateway::GatewayResponse");
  const expectedTypes = ["DEFAULT_4XX", "DEFAULT_5XX", "UNAUTHORIZED", "ACCESS_DENIED", "MISSING_AUTHENTICATION_TOKEN"];

  for (const responseType of expectedTypes) {
    const response = gatewayResponses.find((resource) => resource.Properties.ResponseType === responseType);
    assert.ok(response, `Missing ${responseType} gateway response`);
    const parameters = response.Properties.ResponseParameters;
    assert.equal(parameters["gatewayresponse.header.Access-Control-Allow-Origin"], `'${amplifyOrigin}'`);
    assert.match(parameters["gatewayresponse.header.Access-Control-Allow-Headers"], /Authorization/);
    assert.match(parameters["gatewayresponse.header.Access-Control-Allow-Headers"], /Content-Type/);
  }
});

test("Phase 2 CORS changes do not synthesize NAT Gateway or RDS Proxy resources", () => {
  const types = resources.map((resource) => resource.Type);
  assert.ok(!types.includes("AWS::EC2::NatGateway"));
  assert.ok(!types.includes("AWS::RDS::DBProxy"));
  assert.ok(!types.includes("AWS::RDS::DBProxyTargetGroup"));
});
