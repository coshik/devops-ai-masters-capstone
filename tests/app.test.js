const request = require("supertest");

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: mockSend
  })),
  GetSecretValueCommand: jest.fn().mockImplementation((input) => input)
}));

describe("Application", () => {
  beforeEach(() => {
    jest.resetModules();
    mockSend.mockReset();
    delete process.env.SECRET_ARN;
  });

  test("GET / should return application information", async () => {
    const app = require("../app/server");
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("running");
  });

  test("GET /health should return healthy status", async () => {
    const app = require("../app/server");
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("healthy");
  });

  test("secret status reports unconfigured when no ARN is set", async () => {
    const app = require("../app/server");
    const response = await request(app).get("/secret-status");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ configured: false });
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("secret status confirms retrieval without exposing the value", async () => {
    process.env.SECRET_ARN =
      "arn:aws:secretsmanager:ap-south-1:288761772142:secret:demo";
    mockSend.mockResolvedValue({ SecretString: "test-only-secret" });

    const app = require("../app/server");
    const response = await request(app).get("/secret-status");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ configured: true });
    expect(JSON.stringify(response.body)).not.toContain("test-only-secret");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("secret status returns 503 when retrieval fails", async () => {
    process.env.SECRET_ARN = "demo-secret-arn";
    mockSend.mockRejectedValue(new Error("Access denied"));

    const app = require("../app/server");
    const response = await request(app).get("/secret-status");

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({ configured: false });
  });
});
