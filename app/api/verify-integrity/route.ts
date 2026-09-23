import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

// Hardcoded GCP credentials
const GCP_CREDENTIALS ={
                         "type": "service_account",
                         "project_id": "mygintigrity",
                         "private_key_id": "dd8cd5b7c5f2252fe6beee2307896abea8bf0953",
                         "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzLhdtIu5d9VEm\n67yT4sWfY03hCjBdEwe40Rp+0EKsO3eQdLDxgOAlr8r43CNxZNss+sh7TQ3kdl2B\n3CRikm/Suv+e2vim8+mmdWoSjbD8P1Xm5jc03qHudE3u475oS2kvUqvTv70cxsZd\nEhO/1o3aGsPpAf5Var+eg6hKai8h9ml+YwKYwEqcJz/cWt5z0jUYrvdVgc+AB66j\nc6bN17UW1LbRvWdGZlZteWZWVhdy7oBKLvLYFd/mu4xAUIXSY4a4vErxyJBW53sC\n8KJZWHvFQH+mzF7FwABe+jD2vh6PF/o7pdYHtV/AUY/zXDSYmehnnpr3IPyW9f/1\ntOZGeQsNAgMBAAECggEAA1yAjKt4Fmde9SQSUlqRuPYS8vEH4Txx0sBReNCpzcGR\nKzKxqGm42PiWf9sZXOThW7b9kH4lc1mh/W//dy+0vuHYvKoOuhlJ9nyuEGbRL0Tn\nkU7GTpPvEDBzedMElfj1FBVpuVhtJlhFm7SyxtCj6wz6KBtsPpMVTyvY5LR8Iol+\ntt44eWlgaLKmkw136VEedTkJk32RdGYDTnAmJUFtH+LLs0DQiubd+neyTHICsOxS\nS5ACKbEpiOQQCam2Z3eM60AcFsjK1YKxIL82mHiAxCOrwLrUZQHdbg8MF2Nz9j/u\nw8iprUjh3UDpOsLyrb97UlhTSZz1W9/ni3jkMzb3HQKBgQDXKJ4HB9DU9DelKviw\ngP1aqOMVpmTv+TDyDM13a2Bdvu/6lvqo3CNL9gQaT3DjjLkV1IzAhEN2oXbpSNok\njCM83uTkSFro7N47OqRRVfPzR0gbCLq2908SgpcBC22hqziBCZs6v+T6dDXpOXH2\nlLPuo1tckILQGLAB7RI24f73IwKBgQDVMSK0bhm4XWEZYMq3Kqzrz2JC4lomE0rw\n399TQPY7g95X5s8AjPMzRz20HAYHB3nCrZsU5DE+qoaWztdgFIqROIINDhJSskvL\nUR90LSfkAAT0iFawy0ODwHqF9r71ccPSpu2XMkYOvYVxuGukkjKcWzqwxmVhdpVs\naBiteSYwDwKBgC2z6gVySpDBo4RJIXRUofx8/Wee5bf3xcbUo1xniZvAMDeZlHsD\n79d11Z9FGqSrQrF5acCHF9F+MMUS/Ytf3ShT7Gj1WaI6lmYcacUBLgWSMaXUb9zn\noXs8FBlbtRjvRtxaDwgmtNvijYUR97w6EBJzzrdV1wOfCtwN4J2Z2c/jAoGBAL7n\nAdmpoZRq4bD08HE2YKPED4wu3mSr7/Zjsbn+OL+wZKA3yPMIRBqN1535XhhbRFfk\nVzNM5x/jWSOf0lJx8mb5v9Lq39N3XtGQMec5LDhJICbMEzy6txk6eTyOaA6nMZ/m\n5Gf4l61JXj4n0xQJ6hICyzpSXaP5qPHrAPYNvvlXAoGAID9rRsM4vHuayYL/bz9U\npylP+kyvxfnO94O7RN0lm7Eo2TrO2CYTUC+ghExPEKWZmIf9AJEQR9eT2lMtKfzr\nt6+tFfbkhW1oaQtUn4V3sMK1wS9XmkskivgYa9OwtT0izv5U6ipXpSzNi4r1zY5C\nw9ZVUxd1OWsR5dCV/9AbnmI=\n-----END PRIVATE KEY-----\n",
                         "client_email": "mygoogleplayintigrity@mygintigrity.iam.gserviceaccount.com",
                         "client_id": "115983173969335134851",
                         "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                         "token_uri": "https://oauth2.googleapis.com/token",
                         "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                         "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/mygoogleplayintigrity%40mygintigrity.iam.gserviceaccount.com",
                         "universe_domain": "googleapis.com"
                       };

// GET: Generate/retrieve deterministic HMAC nonce
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const secretKey = getSecret();

    const nonce = crypto.createHmac('sha256', secretKey)
      .update(userId)
      .digest('base64url');

    return NextResponse.json({ success: true, userId, nonce });
  } catch (error: any) {
    return NextResponse.json({ error: '[GET_ERROR] Failed to generate nonce', details: error.message }, { status: 500 });
  }
}

// POST: Verify Play Integrity token
export async function POST(request: Request) {
  try {
    // Step 1: Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      return NextResponse.json(
        { error: '[REQUEST_PARSE_ERROR] Failed to parse request body as JSON', details: parseError.message },
        { status: 400 }
      );
    }
    
    // Step 2: Validate required fields
    const { integrityToken, expectedUserId } = body;
    if (!integrityToken) {
      return NextResponse.json(
        { error: '[MISSING_TOKEN] Request missing integrityToken field' },
        { status: 400 }
      );
    }

    // Step 3: Initialize Google Auth with hardcoded credentials
    let auth;
    try {
      auth = new GoogleAuth({
        credentials: GCP_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/playintegrity'],
      });
    } catch (authError: any) {
      return NextResponse.json(
        { error: '[AUTH_INIT_ERROR] Failed to initialize Google Auth', details: authError.message },
        { status: 500 }
      );
    }

    // Step 4: Get authenticated client
    let authClient;
    try {
      authClient = await auth.getClient();
    } catch (clientError: any) {
      return NextResponse.json(
        { error: '[CLIENT_ERROR] Failed to get authenticated client', details: clientError.message },
        { status: 500 }
      );
    }

    // Step 5: Create Play Integrity client
    let client;
    try {
      client = playintegrity({ version: 'v1', auth: authClient as any });
    } catch (clientInitError: any) {
      return NextResponse.json(
        { error: '[PLAYINTEGRITY_CLIENT_ERROR] Failed to create Play Integrity client', details: clientInitError.message },
        { status: 500 }
      );
    }

    // Step 6: Call Google Play Integrity API
    let response;
    try {
      const packageName = 'com.orgname.PushNotification';
      response = await client.v1.decodeIntegrityToken({
        packageName,
        requestBody: { integrityToken },
      });
    } catch (apiError: any) {
      return NextResponse.json(
        { error: '[PLAYINTEGRITY_API_ERROR] Failed to decode integrity token', details: apiError.message },
        { status: 500 }
      );
    }

    // Step 7: Extract and validate nonce
    const payload = response.data.tokenPayloadExternal;
    const receivedNonce = payload?.requestDetails?.nonce;

    let nonceValid = true;
    if (expectedUserId) {
      const expectedNonce = crypto.createHmac('sha256', getSecret())
        .update(expectedUserId)
        .digest('base64url');
      nonceValid = receivedNonce === expectedNonce;
    }

    return NextResponse.json({
      success: true,
      nonceValid,
      receivedNonce,
      payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '[UNEXPECTED_ERROR] Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
