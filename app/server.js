const express = require("express");
const {
  SecretsManagerClient,
  GetSecretValueCommand
} = require("@aws-sdk/client-secrets-manager");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || "ap-south-1"
});

let cachedSecret;
let secretLoadPromise;

async function loadSecret() {
  if (cachedSecret !== undefined) return cachedSecret;
  if (secretLoadPromise) return secretLoadPromise;

  secretLoadPromise = secretsClient.send(
    new GetSecretValueCommand({
      SecretId: process.env.SECRET_ARN
    })
  ).then((result) => {
    if (!result.SecretString && !result.SecretBinary) {
      throw new Error("Secret has no readable value");
    }
    cachedSecret = true;
    return true;
  }).catch((error) => {
    secretLoadPromise = undefined;
    throw error;
  });

  return secretLoadPromise;
}

app.get("/", (req, res) => {
  res.json({
    message: "DevOps AI Masters Capstone Application",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/secret-status", async (req, res) => {
  if (!process.env.SECRET_ARN) {
    return res.status(200).json({ configured: false });
  }

  try {
    await loadSecret();
    return res.status(200).json({ configured: true });
  } catch (error) {
    // Do not log the error object or secret contents.
    console.error("Secrets Manager retrieval failed.");
    return res.status(503).json({ configured: false });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
  });
}

module.exports = app;
