import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

// Load credentials from file (root folder) - with step-by-step error handling
const loadCredentials = () => {
  const credPath = path.join(process.cwd(), 'mygintigrity-771dc1cb7fc2.json');
  
  // Step 1: Check if file exists
  if (!fs.existsSync(credPath)) {
    throw new Error(`[FILE_NOT_FOUND] Credentials file does not exist at: ${credPath}`);
  }
  
  // Step 2: Try to read file
  let credentialsJson;
  try {
    credentialsJson = fs.readFileSync(credPath, 'utf-8');
  } catch (readError: any) {
    throw new Error(`[FILE_READ_ERROR] Failed to read credentials file: ${readError.message}`);
  }
  
  // Step 3: Trim and validate not empty
  const trimmed = credentialsJson.trim();
  if (!trimmed) {
    throw new Error(`[FILE_EMPTY] Credentials file is empty`);
  }
  
  // Step 4: Try to parse JSON
  try {
    return JSON.parse(trimmed);
  } catch (parseError: any) {
    throw new Error(`[JSON_PARSE_ERROR] Failed to parse credentials JSON: ${parseError.message}. Raw content: ${trimmed.substring(0, 100)}`);
  }
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
    return NextResponse.json({ error: 'Failed to generate nonce', details: error.message }, { status: 500 });
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

    // Step 3: Load credentials from file
    let credentials;
    try {
      credentials = loadCredentials();
    } catch (credError: any) {
      return NextResponse.json(
        { error: credError.message },
        { status: 500 }
      );
    }

    // Step 4: Initialize Google Auth
    let auth;
    try {
      auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/playintegrity'],
      });
    } catch (authError: any) {
      return NextResponse.json(
        { error: '[AUTH_INIT_ERROR] Failed to initialize Google Auth', details: authError.message },
        { status: 500 }
      );
    }

    // Step 5: Get authenticated client
    let authClient;
    try {
      authClient = await auth.getClient();
    } catch (clientError: any) {
      return NextResponse.json(
        { error: '[CLIENT_ERROR] Failed to get authenticated client', details: clientError.message },
        { status: 500 }
      );
    }

    // Step 6: Create Play Integrity client
    let client;
    try {
      client = playintegrity({ version: 'v1', auth: authClient as any });
    } catch (clientInitError: any) {
      return NextResponse.json(
        { error: '[PLAYINTEGRITY_CLIENT_ERROR] Failed to create Play Integrity client', details: clientInitError.message },
        { status: 500 }
      );
    }

    // Step 7: Call Google Play Integrity API
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

    // Step 8: Extract and validate nonce
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
