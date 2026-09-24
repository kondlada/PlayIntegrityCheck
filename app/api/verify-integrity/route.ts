import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

const getGcpCredentials = () => {
  const base64Key = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64Key) {
    throw new Error('GCP_SERVICE_ACCOUNT_KEY_BASE64 is missing');
  }

  const decoded = Buffer.from(base64Key, 'base64').toString('utf-8').trim();
  return JSON.parse(decoded);
};

// GET: Generate/retrieve deterministic HMAC nonce
export async function GET(request: Request) {
  try {
    console.warn('[GET] Nonce request received');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    console.warn('[GET] userId extracted: ' + userId);

    const secretKey = getSecret();
    const nonce = crypto.createHmac('sha256', secretKey).update(userId).digest('base64url');

    console.warn('[GET] Nonce generated successfully (length: ' + nonce.length + ')');
    return NextResponse.json({ success: true, userId, nonce });
  } catch (error: any) {
    console.warn('[GET] Error: ' + error.message);
    return NextResponse.json(
      { error: '[GET_ERROR] Failed to generate nonce', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Verify Play Integrity token
export async function POST(request: Request) {
  try {
    console.warn('[POST] Verification request received');

    let body: any;
    try {
      console.warn('[POST] Parsing request body');
      body = await request.json();
      console.warn('[POST] Request body parsed successfully');
    } catch (parseError: any) {
      console.warn('[POST] JSON parse error: ' + parseError.message);
      return NextResponse.json(
        {
          error: '[REQUEST_PARSE_ERROR] Failed to parse request body as JSON',
          details: parseError.message,
        },
        { status: 400 }
      );
    }

    const { integrityToken, expectedUserId } = body;
    console.warn('[POST] Extracted fields - token present: ' + (!!integrityToken) + ', userId: ' + expectedUserId);

    if (!integrityToken) {
      console.warn('[POST] Missing integrityToken');
      return NextResponse.json(
        { error: '[MISSING_TOKEN] Request missing integrityToken field' },
        { status: 400 }
      );
    }

    console.warn('[POST] Decoding GCP credentials');
    let credentials;
    try {
      credentials = getGcpCredentials();
      console.warn('[POST] Credentials ready');
    } catch (decodeError: any) {
      console.warn('[POST] Credentials decode error: ' + decodeError.message);
      return NextResponse.json({ error: decodeError.message }, { status: 500 });
    }

    console.warn('[POST] Initializing Google Auth');
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/playintegrity'],
    });

    console.warn('[POST] Getting auth client');
    const authClient = await auth.getClient();
    console.warn('[POST] Auth client ready');

    console.warn('[POST] Creating Play Integrity client');
    const client = playintegrity({ version: 'v1', auth: authClient as any });

    const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.orgname.PushNotification';
    console.warn('[POST] Calling decodeIntegrityToken (packageName: ' + packageName + ')');

    const response = await client.v1.decodeIntegrityToken({
      packageName,
      requestBody: { integrityToken },
    });

    console.warn('[POST] Play Integrity API call successful');
    const payload = response.data.tokenPayloadExternal;
    const receivedNonce = payload?.requestDetails?.nonce;
    console.warn('[POST] Received nonce (length: ' + (receivedNonce ? receivedNonce.length : 0) + ')');

    let nonceValid = true;
    if (expectedUserId) {
      const expectedNonce = crypto.createHmac('sha256', getSecret()).update(expectedUserId).digest('base64url');
      nonceValid = receivedNonce === expectedNonce;
      console.warn('[POST] Nonce validation result: ' + nonceValid);
    }

    console.warn('[POST] Verification complete, returning success response');
    return NextResponse.json({
      success: true,
      nonceValid,
      receivedNonce,
      payload,
    });
  } catch (error: any) {
    console.warn('[POST] Unexpected error: ' + error.message);
    return NextResponse.json(
      { error: '[UNEXPECTED_ERROR] Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
