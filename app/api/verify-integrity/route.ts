import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

// Load credentials from file (root folder)
const loadCredentials = () => {
  try {
    const credPath = path.join(process.cwd(), 'mygintigrity-771dc1cb7fc2.json');
    const credentialsJson = fs.readFileSync(credPath, 'utf-8');
    const credentials = JSON.parse(credentialsJson);
    console.log('Credentials loaded from file:', credPath);
    return credentials;
  } catch (error: any) {
    console.error('Failed to load credentials from file:', error.message);
    throw new Error(`Failed to load GCP credentials: ${error.message}`);
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
    let body;
    
    // Try to parse as JSON
    try {
      body = await request.json();
    } catch (parseError) {
      // If JSON parsing fails, try reading as text and parsing manually
      const text = await request.text();
      console.error('Raw body text:', text);
      body = JSON.parse(text);
    }
    
    const { integrityToken, expectedUserId } = body;

    if (!integrityToken) {
      return NextResponse.json({ error: 'Missing integrityToken' }, { status: 400 });
    }

    // Load credentials from file
    const credentials = loadCredentials();

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/playintegrity'],
    });

    const authClient = await auth.getClient();
    const client = playintegrity({ version: 'v1', auth: authClient as any });

    const packageName = credentials.project_id ? 'com.orgname.PushNotification' : process.env.ANDROID_PACKAGE_NAME!;
    const response = await client.v1.decodeIntegrityToken({
      packageName,
      requestBody: { integrityToken },
    });

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
    console.error('Play Integrity API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
