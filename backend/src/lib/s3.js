// S3 helper: pre-signed uploads go browser -> S3 directly (never through EC2).
// In dev we talk to LocalStack (S3_ENDPOINT_URL); in prod/w your real account.
// NOTE: the SDK natively honors a global AWS_ENDPOINT_URL for every service —
// which would also hijack SNS — so we scope each service to its own variable.
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.USE_REAL_AWS ? undefined : process.env.S3_ENDPOINT_URL;

export const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // newer SDKs inject x-amz-sdk-checksum-algorithm into PUTs — pre-signed URLs
  // signed without it then fail server-side, so only checksum when required
  requestChecksumCalculation: 'WHEN_REQUIRED',
  ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
});

export const bucket = process.env.S3_BUCKET || 'placementhub-resumes-dev';

export async function presignResumeUpload(key, contentType = 'application/pdf', expiresIn = 600) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function presignResumeDownload(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function uploadResumeDirect(key, buffer, contentType = 'application/pdf') {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType });
  await s3.send(cmd);
  return { key, bucket };
}

