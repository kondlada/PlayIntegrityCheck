import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

const GCP_SERVICE_ACCOUNT_KEY_BASE64 = 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibXlnaW50aWdyaXR5IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiZGQ4Y2Q1YjdjNWYyMjUyZmU2YmVlZTIzMDc4OTZhYmVhOGJmMDk1MyIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDekxoZHRJdTVkOVZFbVxuNjd5VDRzV2ZZMDNoQ2pCZEV3ZTQwUnArMEVLc08zZVFkTER4Z09BbHI4cjQzQ054Wk5zcytzaDdUUTNrZGwyQlxuM0NSaWttL1N1ditlMnZpbTgrbW1kV29TamJEOFAxWG01amMwM3FIdWRFM3U0NzVvUzJrdlVxdlR2NzBjeHNaZFxuRWhPLzFvM2FHc1BwQWY1VmFyK2VnNmhLYWk4aDltbCtZd0tZd0VxY0p6L2NXdDV6MGpVWXJ2ZFZnYytBQjY2alxuYzZiTjE3VVcxTGJSdldkR1psWnRlV1pXVmhkeTdvQktMdkxZRmQvbXU0eEFVSVhTWTRhNHZFcnh5SkJXNTNzQ1xuOEtKWldIdkZRSCttekY3RndBQmUrakQydmg2UEYvbzdwZFlIdFYvQVVZL3pYRFNZbWVobm5wcjNJUHlXOWYvMVxudE9aR2VRc05BZ01CQUFFQ2dnRUFBMXlBakt0NEZtZGU5U1FTVWxxUnVQWVM4dkVINFR4eDBzQlJlTkNwemNHUlxuS3pLeHFHbTQyUGlXZjlzWlhPVGhXN2I5a0g0bGMxbWgvVy8vZHkrMHZ1SFl2S29PdWhsSjlueXVFR2JSTDBUblxua1U3R1RwUHZFREJ6ZWRNRWxmajFGQlZwdVZodEpsaEZtN1N5eHRDajZ3ejZLQnRzUHBNVlR5dlk1TFI4SW9sK1xudHQ0NGVXbGdhTEtta3cxMzZWRWVkVGtKazMyUmRHWURUbkFtSlVGdEgrTExzMERRaXViZCtuZXlUSElDc094U1xuUzVBQ0tiRXBpT1FRQ2FtMlozZU02MEFjRnNqSzFZS3hJTDgybUhpQXhDT3J3THJVWlFIZGJnOE1GMk56OWovdVxudzhpcHJVamgzVURwT3NMeXJiOTdVbGhUU1p6MVc5L25pM2prTXpiM0hRS0JnUURYS0o0SEI5RFU5RGVsS3Zpd1xuZ1AxYXFPTVZwbVR2K1REeURNMTNhMkJkdnUvNmx2cW8zQ05MOWdRYVQzRGpqTGtWMUl6QWhFTjJvWGJwU05va1xuakNNODN1VGtTRnJvN000N09xUlJWZlB6UjBnYkNMcTI5MDhTZ3BjQkMyMmhxemlCQ1pzNnYrVDZkRFhwT1hIMlxubExQdW8xdGNrSUxRR0xBQjdSSTI0ZjczSXdLQmdRRFZNU0swYmhtNFhXRVpZTXEzS3F6cnoySkM0bG9tRTByd1xuMzk5VFFQWTdnOTVYNXM4QWpQTXpSejIwSEFZSEIzbkNyWnNVNURFK3FvYVd6dGRnRklxUk9JSU5EaEpTc2t2TFxuVVI5MExTZmtBQVQwaUZhd3kwT0R3SHFGOXI3MWNjUFNwdTJYTWtZT3ZZVnh1R3Vra2pLY1d6cXd4bVZoZHBWc1xuYUJpdGVTWXdEd0tCZ0MyejZnVnlTcERCbzRSSklYUlVvZng4L1dlZTViZjN4Y2JVbzF4bmladkFNRGVabEhzRFxuNzlkMTFaOUZHcVNyUXJGNWFjQ0hGOUYrTU1VUy9ZdGYzU2hUN0dqMVdhSTZsbVljYWNVQkxnV1NNYVhVYjl6blxub1hzOEZCbGJ0Ump2UnR4YUR3Z210TnZpallVUjk3dzZFQkp6enJkVjF3T2ZDdHdONEoyWjJjL2pBb0dCQUw3blxuQWRtcG9aUnE0YkQwOEhFMllLUEVENHd1M21TcjcvWmpzYm4rT0wrd1pLQTN5UE1JUkJxTjE1MzVYaGhiUkZma1xuVnpOTTV4L2pXU09mMGxKeDhtYjV2OUxxMzlOM1h0R1FNZWM1TERoSklDYk1Fenk2dHhrNmVUeU9hQTZuTVovbVxuNUdmNGw2MUpYajRuMHhRSjZoSUN5enBTWGFQNXFQSHJBUFlOdnZsWEFvR0FJRDlyUnNNNHZIdWF5WUwvYno5VVxucHlsUCtreXZ4Zm5POTRPN1JOMGxtN0VvMlRyTzJDWVRVQytnaEV4UEVLV1ptSWY5QUpFUVI5ZVQybE10S2Z6clxudDYrdEZmYmtoVzFvYVF0VW40VjNzTUsxd1M5WG1rc2tpdmdZYTlPd3RUMGl6djVVNmlwWHBTek5pNHIxelk1Q1xudzlaVlV4ZDFPV3NSNWRDVi85QWJubUk9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAibXlnb29nbGVwbGF5aW50aWdyaXR5QG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTU5ODMxNzM5NjkzMzUxMzQ4NTEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L215Z29vZ2xlcGxheWludGlncml0eSU0MG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=';

const getGcpCredentials = () => {
  try {
    console.warn('[GCP] Decoding hardcoded base64 credentials...');
    const decoded = Buffer.from(GCP_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8').trim();
    console.warn('[GCP] Decoded length: ' + decoded.length);
    
    const creds = JSON.parse(decoded);
    console.warn('[GCP] Parsed successfully');
    console.warn('[GCP] Project ID: ' + creds.project_id);
    console.warn('[GCP] Client Email: ' + creds.client_email);
    console.warn('[GCP] Private Key ID: ' + creds.private_key_id);
    
    // Fix escaped newlines in private_key
    if (creds.private_key && typeof creds.private_key === 'string') {
      const before = creds.private_key.length;
      if (creds.private_key.includes('\\n')) {
        console.warn('[GCP] Found escaped newlines, converting to real newlines...');
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
        console.warn('[GCP] Private key converted (before: ' + before + ', after: ' + creds.private_key.length + ')');
      }
      console.warn('[GCP] Private key starts with:', creds.private_key.substring(0, 50));
      console.warn('[GCP] Private key ends with:', creds.private_key.substring(creds.private_key.length - 50));
    }
    
    return creds;
  } catch (error: any) {
    console.warn('[GCP] ERROR:', error.message);
    console.warn('[GCP] Stack:', error.stack);
    throw error;
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
      console.warn('[POST] ===== CREDENTIALS DEBUG =====');
      console.warn('[POST] Type: ' + credentials.type);
      console.warn('[POST] Project ID: ' + credentials.project_id);
      console.warn('[POST] Private Key ID: ' + credentials.private_key_id);
      console.warn('[POST] Client Email: ' + credentials.client_email);
      console.warn('[POST] Client ID: ' + credentials.client_id);
      if (credentials.private_key) {
        console.warn('[POST] Private Key length: ' + credentials.private_key.length);
        console.warn('[POST] Private Key starts with: ' + credentials.private_key.substring(0, 50));
        console.warn('[POST] Private Key ends with: ' + credentials.private_key.substring(credentials.private_key.length - 50));
        console.warn('[POST] Private Key has actual newlines: ' + credentials.private_key.includes('\n'));
      }
      console.warn('[POST] ===== END CREDENTIALS DEBUG =====');
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
