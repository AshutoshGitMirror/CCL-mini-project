// Notification fan-out. One function, two transports:
//  - real:  Amazon SNS Publish (works cross-account if the topic policy allows
//           the publisher's account; teammates use the same topic ARN)
//  - local: SNS on LocalStack, or pure log when neither is configured
// Every message is also persisted (notifications table) for the audit trail.
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import prisma from '../db.js';

// SNS goes to the real topic by default (SNS_TOPIC_ARN is a real ARN; SNS
// publishes are free, and the demo needs a genuine MessageId). Pin it to
// LocalStack only with SNS_ENDPOINT_URL=http://localhost:4566.
const endpoint = process.env.SNS_ENDPOINT_URL || undefined;

const sns = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
});

export function transport() {
  if (process.env.SNS_TOPIC_ARN) return 'sns';
  return 'log';
}

export async function broadcast({ subject, message, driveId = null }) {
  const topicArn = process.env.SNS_TOPIC_ARN;
  let status = 'LOGGED';
  let messageId = null;

  if (topicArn) {
    try {
      const res = await sns.send(
        new PublishCommand({
          TopicArn: topicArn,
          Subject: subject.slice(0, 99),   // SNS subject cap
          Message: message,
          MessageAttributes: driveId
            ? { driveId: { DataType: 'String', StringValue: driveId } }
            : undefined,
        })
      );
      messageId = res.MessageId;
      status = 'SENT';
    } catch (err) {
      status = `FAILED: ${err.message}`;
      console.error('[sns] publish failed:', err.message);
    }
  }

  const record = await prisma.notification.create({
    data: { subject, message, channel: topicArn ? 'SNS' : 'INAPP', messageId, status, driveId },
  });

  return { status, messageId, notification: record };
}
