import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

// Hardcoded GCP credentials
const GCP_CREDENTIALS = {
  "type": "service_account",
  "project_id": "mygintigrity",
  "private_key_id": "771dc1cb7fc2dc1fe9f57f794973ee546b1a7d0c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD5svTgvzQsOlVY\n8ahSf7lQ6DH3KWow+v7hnJyq3QIvLcBRLCesKRP69ekl4RcrLmdFMhxWAQj3PnM1\ncRFnS/TER7KirE6lkV7tIuNB0Fo15Qlg893J0O4MF5XNxlDKdYx/0Nga0X01w/1s\n2n4MH8YDc06MquL7wAMvVuiWoRWKnllegwwQ66BUuYTQLKDms5Qxf8IQk9TOG31G\npeCMCoN2mmmPHh4YaLbgHy+RAFbnRXwqTbIm+HvCdRuzanBzOK5Lbju93pGsdjMH\noKBxDmKeT63KJssBaDwuvQ4xlL6DEBHUdzQWls/c/OWG9PyUlNXk1a4ZabGgkLpo\nborQwl5jAgMBAAECggEAHWsCjl9TJ791olrSOxSrghyLv8lZe/d47klebIOeSBhV\nTJrtpPWv/MSvw76Jqr+MUNWEYMjoGVelCM+kk8LEoxf+s/X7TBFc7tufN6Kdm4o7\njnhyEbQI9P7AWkkk5+gXy0/mbf5usytp4O26+ksHWre2h5HIgo15h+sZevRJI+v5\nb5BGivGSEigXknWYNs9zwagfcFqqyyeNhsNfVwISKAyamMFphYNUcsfADoe44jG1\nX7iWg5jdsPDf9vy/SoXAig6h409k+niSiHvT+36eUVArSFcBjHs2oCz6QjgEUl25\nE7GSMutKnMeZdbDaoJlgsAoFewSum0fkPW8BWQ09QQKBgQD/7s6yIrGAGGwH6xH3\nJrwi9rLhoDV12Dme1NXuguyTJRXCHHTm1ZMyptNtZs3I67URyji4LfPSwIMOyMc1\n+SeenAbC1aT8kU4Icy4UjcEzz9pc2d5WEeqbklQisGGbI3E/V2mEYF/X1svcKg9Q\nELBiZqlHMu4sQv5m8ud5YlBCQQKBgQD5w7r6mGwOyy/ZqDgqc7mqaJCHw9htrSqE\nloICgFeKiatsu+VbQm4YKRZZpL4PSWvnRlwnXLXF/15EmbbdKC0nMBHk2kd3D31u\nblQgleyLxYSK30lnyMGcAvTr84iEn3AdBmrzfkPTn1ugyTYv8KjBidTuZ+7l+gcH\nDWCxM25vowKBgCd+MVUZt2w92IXMR2RtDMEUcnwQnc9Gg3W4AB8jAuCd62Kdw4hP\nUryRM7UBFSY5ASLyopgBN0vBOzgP0XXJscxu5TgxgZkbzv/MzkKLsVGOdHK5h+6e\nKybAiM0ljJpE+Ne+ZGDyAjgrRCAAOYawXJeCogKDoG8iE2HNf9yiSCJBAoGBAMV5\nI5SOfqETtTl57y5hYSKCmgM9rRjKGRvLg+9GWfCG+Kp3xNdqpnEjyzAFOOANROsO\njj3w5ycsyPOkNRiWc1zQfNVcX7Sa4qk1Qf6hiuzXtfu2nusXpzwaelszqXRyOso4\nEMeDxUzEakWt0NIGjOa4e0ojkpbyICxLP2/bIi3RAoGAbSsyqf8L+yNywzrYeYsq\nrMzxfA65jIs0d5T04EnG6MncC8F9znKINa38nITQoHtXqoKucPP1g4SOJIxvs07e\nZpzvgPnhdcUcYJnG0+1MU2vVnxEoUVSmvVqLpqqbX7SU58age2jL1KlAPBwpMvRC\nO8EymShgOFk56Ne24kL3Ryc=\n-----END PRIVATE KEY-----\n",
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
