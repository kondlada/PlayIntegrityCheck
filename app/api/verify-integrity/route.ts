import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

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

    if (!process.env.GCP_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json({ error: 'GCP_SERVICE_ACCOUNT_KEY is missing' }, { status: 500 });
    }

    const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/playintegrity'],
    });

    const authClient = await auth.getClient();
    const client = playintegrity({ version: 'v1', auth: authClient as any });

    const packageName = process.env.ANDROID_PACKAGE_NAME!;
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
