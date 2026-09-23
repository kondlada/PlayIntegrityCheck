import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

// Base64-encoded GCP credentials (new credentials - decode at runtime for security)
const GCP_CREDENTIALS_BASE64 = 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibXlnaW50aWdyaXR5IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiZGQ4Y2Q1YjdjNWYyMjUyZmU2YmVlZTIzMDc4OTZhYmVhOGJmMDk1MyIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDekxoZHRJdTVkOVZFbVxuNjd5VDRzV2ZZMDNoQ2pCZEV3ZTQwUnArMEVLc08zZVFkTER4Z09BbHI4cjQzQ054Wk5zcytzaDdUUTNrZGwyQlxuM0NSaWttL1N1ditlMnZpbTgrbW1kV29TamJEOFAxWG01amMwM3FIdWRFM3U0NzVvUzJrdlVxdlR2NzBjeHNaZFxuRWhPLzFvM2FHc1BwQWY1VmFyK2VnNmhLYWk4aDltbCtZd0tZd0VxY0p6L2NXdDV6MGpVWXJ2ZFZnYytBQjY2alxuYzZiTjE3VVcxTGJSdldkR1psWnRlV1pXVmhkeTdvQktMdkxZRmQvbXU0eEFVSVhTWTRhNHZFcnh5SkJXNTNzQ1xuOEtKWldIdkZRSCttekY3RndBQmUrakQydmg2UEYvbzdwZFlIdFYvQVVZL3pYRFNZbWVobm5wcjNJUHlXOWYvMVxudE9aR2VRc05BZ01CQUFFQ2dnRUFBMXlBakt0NEZtZGU5U1FTVWxxUnVQWVM4dkVINFR4eDBzQlJlTkNwemNHUlxuS3pLeXhxR200MlBpV2Y5c1pYT1RoVzdiOWtINGxjMW1oL1cvL2R5KzB2dUhZdktvT3VobEo5bnl1RUdiUkwwVG5cbiEtLVRQ0VlHQ1RwUHZFREJ6ZWRNRWxmajFGQlZwdVZodEpsaEZtN1N5eHRDajZ3ejZLQnRzUHBNVlR5dlk1TFI4SW9sK1xudHQ0NGVXbGdhTEtta3cxMzZWRWVkVGtKazMyUmRHWURUbkFtSlVGdEgrTExzMERRaXViZCtuZXlUSElDc094U1xuUzVBQ0tiRXBpT1FRQ2FtMlozZU02MEFjRnNqSzFZS3hJTDgybUhpQXhDT3J3THJVWlFIZGJnOE1GMk56OWovdVxudzhpcHJVamgzVURwT3NMeXJiOTdVbGhUU1p6MVc5L25pM2prTXpiM0hRS0JnUURYS0o0SEI5RFU5RGVsS3Zpd1xuZ1AxYXFPTVZwbVR2K1REeURNMTNhMkJkdnUvNmx2cW8zQ05MOWdRYVQzRGpqTGtWMUl6QWhFTjJvWGJwU05va1xuakNNODN1VGtTRnJvN040N09xUlJWZlB6UjBnYkNMcTI5MDhTZ3BjQkMyMmhxemlCQ1pzNnYrVDZkRFhwT1hIMlxubExQdW8xdGNrSUxRR0xBQjdSSTI0ZjczSXdLQmdRRFZNU0swYmhtNFhXRVpZTXEzS3F6cnoySkM0bG9tRTByd1xuMzk5VFFQWTdnOTVYNXM4QWpQTXpSejIwSEFZSEIzbkNyWnNVNURFK3FvYVd6dGRnRklxUk9JSU5EaEpTc2t2TFxuVVI5MExTZmtBQVQwaUZhd3kwT0R3SHFGOXI3MWNjUFNwdTJYTWtZT3ZZVnh1R3Vra2pLY1d6cXd4bVZoZHBWc1xuYUJpdGVTWXdEd0tCZ0MyejZnVnlTcERCbzRSSklYUlVvZng4L1dlZTViZjN4Y2JVbzF4bmladkFNRGVabEhzRFxuNzlkMTFaOUZHcVNyUXJGNWFjQ0hGOUYrTU1VUy9ZdGYzU2hUN0dqMVdhSTZsbVljYWNVQkxnV1NNYVhVYjl6blxub1hzOEZCbGJ0Ump2UnR4YUR3Z210TnZpallVUjk3dzZFQkp6enJkVjF3T2ZDdHdONEoyWjJjL2pBb0dCQUw3blxuQWRtcG9aUnE0YkQwOEhFMllLUEVENHd1M21TcjcvWmpzYm4rT0wrd1pLQTN5UE1JUkJxTjE1MzVYaGhiUkZma1xuVnpOTTV4L2pXU09mMGxKeDhtYjV2OUxxMzlOM1h0R1FNZWM1TERoSklDYk1Fenk2dHhrNmVUeU9hQTZuTVovbVxuNUdmNGw2MUpYajRuMHhRSjZoSUN5enBTWGFQNXFQSHJBUFlOdnZsWEFvR0FJRDlyUnNNNHZIdWF5WUwvYno5VVxucHlsUCtreXZ4Zm5POTRPN1JOMGxtN0VvMlRyTzJDWVRVQytnaEV4UEVLV1ptSWY5QUpFUVI5ZVQybE10S2Z6clxudDYrdEZmYmtoVzFvYVF0VW40VjNzTUsxd1M5WG1rc2tpdmdZYTlPd3RUMGl6djVVNmlwWHBTek5pNHIxelk1Q1xudzlaVlV4ZDFPV3NSNWRDVi85QWJubUk9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAibXlnb29nbGVwbGF5aW50aWdyaXR5QG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTU5ODMxNzM5NjkzMzUxMzQ4NTEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L215Z29vZ2xlcGxheWludGlncml0eSU0MG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=';

// Decode base64 credentials at runtime
const getGcpCredentials = () => {
  try {
    console.warn('[GCP] Starting credentials decode from base64');
    const decoded = Buffer.from(GCP_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    console.warn('[GCP] Decoded credentials string (length: ' + decoded.length + ')');
    const creds = JSON.parse(decoded);
    console.warn('[GCP] Credentials parsed successfully, project_id: ' + creds.project_id);
    return creds;
  } catch (error: any) {
    console.warn('[GCP] Credentials decode failed: ' + error.message);
    throw new Error(`[CREDENTIALS_DECODE_ERROR] Failed to decode GCP credentials: ${error.message}`);
  }
};

// GET: Generate/retrieve deterministic HMAC nonce
export async function GET(request: Request) {
  try {
    console.warn('[GET] Nonce request received');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    console.warn('[GET] userId extracted: ' + userId);
    
    const secretKey = getSecret();
    const nonce = crypto.createHmac('sha256', secretKey)
      .update(userId)
      .digest('base64url');

    console.warn('[GET] Nonce generated successfully (length: ' + nonce.length + ')');
    return NextResponse.json({ success: true, userId, nonce });
  } catch (error: any) {
    console.warn('[GET] Error: ' + error.message);
    return NextResponse.json({ error: '[GET_ERROR] Failed to generate nonce', details: error.message }, { status: 500 });
  }
}

// POST: Verify Play Integrity token
export async function POST(request: Request) {
  try {
    console.warn('[POST] Verification request received');
    
    // Step 1: Parse request body
    let body;
    try {
      console.warn('[POST] Parsing request body');
      body = await request.json();
      console.warn('[POST] Request body parsed successfully');
    } catch (parseError: any) {
      console.warn('[POST] JSON parse error: ' + parseError.message);
      return NextResponse.json(
        { error: '[REQUEST_PARSE_ERROR] Failed to parse request body as JSON', details: parseError.message },
        { status: 400 }
      );
    }
    
    // Step 2: Validate required fields
    const { integrityToken, expectedUserId } = body;
    console.warn('[POST] Extracted fields - token present: ' + (!!integrityToken) + ', userId: ' + expectedUserId);
    
    if (!integrityToken) {
      console.warn('[POST] Missing integrityToken');
      return NextResponse.json(
        { error: '[MISSING_TOKEN] Request missing integrityToken field' },
        { status: 400 }
      );
    }

    // Step 3: Decode and initialize Google Auth
    console.warn('[POST] Decoding GCP credentials');
    let credentials;
    try {
      credentials = getGcpCredentials();
      console.warn('[POST] Credentials ready');
    } catch (decodeError: any) {
      console.warn('[POST] Credentials decode error: ' + decodeError.message);
      return NextResponse.json(
        { error: decodeError.message },
        { status: 500 }
      );
    }

    console.warn('[POST] Initializing Google Auth');
    let auth;
    try {
      auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/playintegrity'],
      });
      console.warn('[POST] Google Auth initialized');
    } catch (authError: any) {
      console.warn('[POST] Auth init error: ' + authError.message);
      return NextResponse.json(
        { error: '[AUTH_INIT_ERROR] Failed to initialize Google Auth', details: authError.message },
        { status: 500 }
      );
    }

    // Step 4: Get authenticated client
    console.warn('[POST] Getting auth client');
    let authClient;
    try {
      authClient = await auth.getClient();
      console.warn('[POST] Auth client ready');
    } catch (clientError: any) {
      console.warn('[POST] Auth client error: ' + clientError.message);
      return NextResponse.json(
        { error: '[CLIENT_ERROR] Failed to get authenticated client', details: clientError.message },
        { status: 500 }
      );
    }

    // Step 5: Create Play Integrity client
    console.warn('[POST] Creating Play Integrity client');
    let client;
    try {
      client = playintegrity({ version: 'v1', auth: authClient as any });
      console.warn('[POST] Play Integrity client created');
    } catch (clientInitError: any) {
      console.warn('[POST] Play Integrity client error: ' + clientInitError.message);
      return NextResponse.json(
        { error: '[PLAYINTEGRITY_CLIENT_ERROR] Failed to create Play Integrity client', details: clientInitError.message },
        { status: 500 }
      );
    }

    // Step 6: Call Google Play Integrity API
    console.warn('[POST] Calling decodeIntegrityToken (packageName: com.orgname.PushNotification)');
    let response;
    try {
      const packageName = 'com.orgname.PushNotification';
      response = await client.v1.decodeIntegrityToken({
        packageName,
        requestBody: { integrityToken },
      });
      console.warn('[POST] Play Integrity API call successful');
    } catch (apiError: any) {
      console.warn('[POST] Play Integrity API error: ' + apiError.message);
      return NextResponse.json(
        { error: '[PLAYINTEGRITY_API_ERROR] Failed to decode integrity token', details: apiError.message },
        { status: 500 }
      );
    }

    // Step 7: Extract and validate nonce
    console.warn('[POST] Extracting payload and validating nonce');
    const payload = response.data.tokenPayloadExternal;
    const receivedNonce = payload?.requestDetails?.nonce;
    console.warn('[POST] Received nonce (length: ' + (receivedNonce ? receivedNonce.length : 0) + ')');

    let nonceValid = true;
    if (expectedUserId) {
      const expectedNonce = crypto.createHmac('sha256', getSecret())
        .update(expectedUserId)
        .digest('base64url');
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
