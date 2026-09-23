import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

// Load credentials from file (root folder) - no env vars
const loadCredentials = () => {
  const credPath = path.join(process.cwd(), 'mygintigrity-771dc1cb7fc2.json');
  const credentialsJson = fs.readFileSync(credPath, 'utf-8').trim();
  return JSON.parse(credentialsJson);
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
    const body = await request.json();
    const { integrityToken, expectedUserId } = body;

    if (!integrityToken) {
      return NextResponse.json({ error: 'Missing integrityToken' }, { status: 400 });
    }

    // Load credentials from file only
    const credentials = loadCredentials();

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/playintegrity'],
    });

    const authClient = await auth.getClient();
    const client = playintegrity({ version: 'v1', auth: authClient as any });

    // Use hardcoded package name
    const packageName = 'com.orgname.PushNotification';
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
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
