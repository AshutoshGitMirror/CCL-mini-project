// S3 bucket bootstrap for dev (LocalStack) and prod (real AWS).
// Idempotent: HeadBucket falls through to CreateBucket + cors config.
import { HeadBucketCommand, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { s3, bucket } from './s3.js';

const CORS_RULES = {
  CORSRules: [
    {
      AllowedOrigins: ['*'], // tighten when the frontend has a fixed origin
      AllowedMethods: ['PUT', 'GET', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag'],
    },
  ],
};

export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return { bucket, created: false };
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    await s3.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: CORS_RULES }));
    console.log(`[s3] bucket ready: ${bucket}`);
    return { bucket, created: true };
  }
}
