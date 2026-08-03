const target = process.argv[2] ?? "api-health";

switch (target) {
  case "api-health": {
    const { handler } = await import("../src/handlers/api.ts");
    const response = await handler({ httpMethod: "GET", path: "/health", headers: { "x-request-id": "local-api-health" }, body: null });
    console.log(JSON.stringify(response, null, 2));
    break;
  }
  case "sqs-analysis-invalid": {
    const { analysisQueueHandler } = await import("../src/handlers/sqs-workers.ts");
    const response = await analysisQueueHandler({ Records: [{ messageId: "local-invalid", body: "{}" }] });
    console.log(JSON.stringify(response, null, 2));
    break;
  }
  case "sqs-audio-invalid": {
    const { audioQueueHandler } = await import("../src/handlers/sqs-workers.ts");
    const response = await audioQueueHandler({ Records: [{ messageId: "local-invalid", body: "{}" }] });
    console.log(JSON.stringify(response, null, 2));
    break;
  }
  case "sqs-notification-invalid": {
    const { notificationQueueHandler } = await import("../src/handlers/sqs-workers.ts");
    const response = await notificationQueueHandler({ Records: [{ messageId: "local-invalid", body: "{}" }] });
    console.log(JSON.stringify(response, null, 2));
    break;
  }
  case "schedule": {
    const { handler } = await import("../src/handlers/schedule.ts");
    const response = await handler({ id: "local-schedule", time: new Date().toISOString(), source: "local", "detail-type": "Local test" });
    console.log(JSON.stringify(response, null, 2));
    break;
  }
  default:
    throw new Error(`Unknown local Lambda target "${target}". Use api-health, sqs-analysis-invalid, sqs-audio-invalid, sqs-notification-invalid or schedule.`);
}
