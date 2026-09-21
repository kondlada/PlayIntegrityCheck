// app/api/verify-integrity/route.ts
import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library'; // Import directly from google-auth-library

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { integrityToken } = body;

    if (!integrityToken) {
      return NextResponse.json(
        { error: 'Missing integrityToken' },
        { status: 400 }
      );
    }

    if (!process.env.GCP_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { error: 'GCP_SERVICE_ACCOUNT_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    // 1. Parse JSON key string
    const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);

    // 2. Instantiate GoogleAuth class directly (NOT via playintegrity.auth)
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/playintegrity'],
    });

    const authClient = await auth.getClient();

    // 3. Initialize Play Integrity SDK client
    const client = playintegrity({
      version: 'v1',
      auth: authClient as any,
    });

    // 4. Request Google to decode token
    const packageName = process.env.ANDROID_PACKAGE_NAME!;
    const response = await client.v1.decodeIntegrityToken({
      packageName,
      requestBody: {
        integrityToken,
      },
    });

    const payload = response.data.tokenPayloadExternal;

    return NextResponse.json({
      success: true,
      payload,
    });
  } catch (error: any) {
    console.error('Play Integrity API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}