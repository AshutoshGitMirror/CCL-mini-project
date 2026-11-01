import { CognitoJwtVerifier } from 'aws-jwt-verify';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminConfirmSignUpCommand,
  AdminAddUserToGroupCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import prisma from '../db.js';

export const cognitoRegion = process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1';
export const userPoolId = process.env.COGNITO_USER_POOL_ID || '';
export const clientId = process.env.COGNITO_CLIENT_ID || '';
export const authMode = (process.env.AUTH_MODE || 'jwt').toLowerCase();

export const isCognitoConfigured = Boolean(userPoolId && clientId);

// Cognito Client for API calls
export const cognitoClient = new CognitoIdentityProviderClient({
  region: cognitoRegion,
});

// Cache the verifier instance
let verifier = null;
if (isCognitoConfigured) {
  try {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id', // verifier can verify ID tokens
      clientId,
    });
  } catch (err) {
    console.warn('[cognito] Failed to initialize CognitoJwtVerifier:', err.message);
  }
}

/**
 * Verify an incoming Cognito token using AWS JWKS
 */
export async function verifyCognitoIdToken(token) {
  if (!verifier) {
    throw new Error('Amazon Cognito is not configured or missing COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID');
  }
  return await verifier.verify(token);
}

/**
 * Register a user in Amazon Cognito User Pool
 */
export async function cognitoRegister({ email, password, name, role = 'STUDENT' }) {
  if (!isCognitoConfigured) {
    throw new Error('Cognito User Pool is not configured');
  }

  const userAttributes = [
    { Name: 'email', Value: email },
    { Name: 'name', Value: name },
    { Name: 'custom:role', Value: role },
  ];

  const signUpCmd = new SignUpCommand({
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: userAttributes,
  });

  const signUpRes = await cognitoClient.send(signUpCmd);

  // If running with AWS admin privileges, auto-confirm for seamless student experience
  if (process.env.COGNITO_AUTO_CONFIRM === 'true') {
    try {
      const confirmCmd = new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: email,
      });
      await cognitoClient.send(confirmCmd);

      // Add to corresponding Cognito User Group (Students, Recruiters, Officers)
      const groupName = role === 'OFFICER' ? 'Officers' : role === 'RECRUITER' ? 'Recruiters' : 'Students';
      try {
        await cognitoClient.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: email,
            GroupName: groupName,
          })
        );
      } catch (grpErr) {
        console.warn(`[cognito] Group assign ${groupName} failed:`, grpErr.message);
      }
    } catch (confErr) {
      console.warn('[cognito] Auto-confirm skipped or not permitted:', confErr.message);
    }
  }

  return signUpRes;
}

/**
 * Authenticate user with Cognito using USER_PASSWORD_AUTH flow
 */
export async function cognitoLogin({ email, password }) {
  if (!isCognitoConfigured) {
    throw new Error('Cognito User Pool is not configured');
  }

  const authCmd = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const authRes = await cognitoClient.send(authCmd);
  const result = authRes.AuthenticationResult;

  if (!result) {
    throw new Error('Cognito authentication returned no tokens');
  }

  return {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken,
    expiresIn: result.ExpiresIn,
  };
}

/**
 * Ensure a Cognito authenticated user exists in the local PostgreSQL database
 * so relational foreign keys (Application, Drive, StudentProfile) remain 100% intact.
 */
export async function syncCognitoUserToDb(payload, fallbackName = null) {
  const email = (payload.email || '').toLowerCase().trim();
  const sub = payload.sub;
  const name = payload.name || fallbackName || email.split('@')[0];
  
  // Extract role from custom:role, cognito:groups, or default to STUDENT
  let role = payload['custom:role'];
  if (!role && Array.isArray(payload['cognito:groups'])) {
    if (payload['cognito:groups'].includes('Officers')) role = 'OFFICER';
    else if (payload['cognito:groups'].includes('Recruiters')) role = 'RECRUITER';
    else role = 'STUDENT';
  }
  if (!role || !['STUDENT', 'RECRUITER', 'OFFICER'].includes(role)) {
    role = 'STUDENT';
  }

  // Find or create in RDS PostgreSQL
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { id: sub }],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: sub, // Use Cognito UUID as user ID
        email,
        passwordHash: 'COGNITO_MANAGED_IDENTITY',
        name,
        role,
      },
    });

    if (role === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          skills: [],
        },
      });
    }
  }

  return user;
}
