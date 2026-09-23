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
    console.log('Reading credentials from:', credPath);
    
    const credentialsJson = fs.readFileSync(credPath, 'utf-8');
    console.log('Raw file content length:', credentialsJson.length);
    console.log('First 100 chars:', credentialsJson.substring(0, 100));
    
    // Remove BOM if present
    const cleanJson = credentialsJson.replace(/^\uFEFF/, '').trim();
    console.log('Cleaned JSON length:', cleanJson.length);
    
    const credentials = JSON.parse(cleanJson);
    console.log('Credentials parsed successfully, project_id:', credentials.project_id);
    return credentials;
  } catch (error: any) {
    console.error('Failed to load credentials from file:', error.message);
    console.error('Error stack:', error.stack);
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
    console.log('POST request received');
    console.log('Content-Type:', request.headers.get('content-type'));
    
    let body;
    
    // Try to parse as JSON
    try {
      body = await request.json();
      console.log('JSON parsed successfully');
    } catch (parseError: any) {
      console.error('JSON parse failed:', parseError.message);
      
      // If JSON parsing fails, try reading as text and parsing manually
      const text = await request.text();
      console.error('Raw body text length:', text.length);
      console.error('Raw body first 200 chars:', text.substring(0, 200));
      console.error('Raw body last 100 chars:', text.substring(Math.max(0, text.length - 100)));
      
      // Try to parse manually
      const trimmed = text.trim();
      console.error('Trimmed text length:', trimmed.length);
      body = JSON.parse(trimmed);
    }
    
    console.log('Body extracted:', { integrityToken: body.integrityToken ? 'present' : 'missing', expectedUserId: body.expectedUserId });
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
    console.log('Calling decodeIntegrityToken with packageName:', packageName);
    
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

    console.log('Verification successful, nonceValid:', nonceValid);
    return NextResponse.json({
      success: true,
      nonceValid,
      receivedNonce,
      payload,
    });
  } catch (error: any) {
    console.error('Play Integrity API Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
