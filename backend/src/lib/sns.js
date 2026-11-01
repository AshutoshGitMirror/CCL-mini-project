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

const primaryTopic = () => process.env.SNS_TOPIC_ARN || '';
const fallbackTopic = () => process.env.SNS_FALLBACK_TOPIC_ARN || '';

export function transport() {
  if (primaryTopic() || fallbackTopic()) return 'sns';
  return 'log';
}

async function publish(topicArn, { subject, message, driveId }) {
  const res = await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Subject: subject.slice(0, 99), // SNS subject cap
      Message: message,
      MessageAttributes: driveId
        ? { driveId: { DataType: 'String', StringValue: driveId } }
        : undefined,
    })
  );
  return res.MessageId;
}

export async function broadcast({ subject, message, driveId = null }) {
  const primary = primaryTopic();
  const fallback = fallbackTopic();

  let status = 'LOGGED';
  let messageId = null;

  if (primary) {
    try {
      messageId = await publish(primary, { subject, message, driveId });
      status = 'SENT';
    } catch (err) {
      console.error('[sns] primary publish failed:', err.message);

      // The shared topic lives in another account. Until its policy grants
      // this account sns:Publish, keep the demo alive through a local topic.
      if (fallback && fallback !== primary) {
        try {
          messageId = await publish(fallback, { subject, message, driveId });
          status = 'SENT';
          console.warn('[sns] published through the local fallback topic');
        } catch (fallbackErr) {
          status = `FAILED: ${err.message}`;
          console.error('[sns] fallback publish failed:', fallbackErr.message);
        }
      } else {
        status = `FAILED: ${err.message}`;
      }
    }
  } else if (fallback) {
    try {
      messageId = await publish(fallback, { subject, message, driveId });
      status = 'SENT';
    } catch (err) {
      status = `FAILED: ${err.message}`;
      console.error('[sns] fallback publish failed:', err.message);
    }
  }

  const record = await prisma.notification.create({
    data: {
      subject,
      message,
      channel: primary || fallback ? 'SNS' : 'INAPP',
      messageId,
      status,
      driveId,
    },
  });

  return { status, messageId, notification: record };
}
