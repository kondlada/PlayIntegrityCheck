import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

// Base64-encoded GCP credentials (new credentials - decode at runtime for security)
//const GCP_CREDENTIALS_BASE64 = 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibXlnaW50aWdyaXR5IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiZGQ4Y2Q1YjdjNWYyMjUyZmU2YmVlZTIzMDc4OTZhYmVhOGJmMDk1MyIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDekxoZHRJdTVkOVZFbVxuNjd5VDRzV2ZZMDNoQ2pCZEV3ZTQwUnArMEVLc08zZVFkTER4Z09BbHI4cjQzQ054Wk5zcytzaDdUUTNrZGwyQlxuM0NSaWttL1N1ditlMnZpbTgrbW1kV29TamJEOFAxWG01amMwM3FIdWRFM3U0NzVvUzJrdlVxdlR2NzBjeHNaZFxuRWhPLzFvM2FHc1BwQWY1VmFyK2VnNmhLYWk4aDltbCtZd0tZd0VxY0p6L2NXdDV6MGpVWXJ2ZFZnYytBQjY2alxuYzZiTjE3VVcxTGJSdldkR1psWnRlV1pXVmhkeTdvQktMdkxZRmQvbXU0eEFVSVhTWTRhNHZFcnh5SkJXNTNzQ1xuOEtKWldIdkZRSCttekY3RndBQmUrakQydmg2UEYvbzdwZFlIdFYvQVVZL3pYRFNZbWVobm5wcjNJUHlXOWYvMVxudE9aR2VRc05BZ01CQUFFQ2dnRUFBMXlBakt0NEZtZGU5U1FTVWxxUnVQWVM4dkVINFR4eDBzQlJlTkNwemNHUlxuS3pLeXhxR200MlBpV2Y5c1pYT1RoVzdiOWtINGxjMW1oL1cvL2R5KzB2dUhZdktvT3VobEo5bnl1RUdiUkwwVG5cbiEtLVRQ0VlHQ1RwUHZFREJ6ZWRNRWxmajFGQlZwdVZodEpsaEZtN1N5eHRDajZ3ejZLQnRzUHBNVlR5dlk1TFI4SW9sK1xudHQ0NGVXbGdhTEtta3cxMzZWRWVkVGtKazMyUmRHWURUbkFtSlVGdEgrTExzMERRaXViZCtuZXlUSElDc094U1xuUzVBQ0tiRXBpT1FRQ2FtMlozZU02MEFjRnNqSzFZS3hJTDgybUhpQXhDT3J3THJVWlFIZGJnOE1GMk56OWovdVxudzhpcHJVamgzVURwT3NMeXJiOTdVbGhUU1p6MVc5L25pM2prTXpiM0hRS0JnUURYS0o0SEI5RFU5RGVsS3Zpd1xuZ1AxYXFPTVZwbVR2K1REeURNMTNhMkJkdnUvNmx2cW8zQ05MOWdRYVQzRGpqTGtWMUl6QWhFTjJvWGJwU05va1xuakNNODN1VGtTRnJvN040N09xUlJWZlB6UjBnYkNMcTI5MDhTZ3BjQkMyMmhxemlCQ1pzNnYrVDZkRFhwT1hIMlxubExQdW8xdGNrSUxRR0xBQjdSSTI0ZjczSXdLQmdRRFZNU0swYmhtNFhXRVpZTXEzS3F6cnoySkM0bG9tRTByd1xuMzk5VFFQWTdnOTVYNXM4QWpQTXpSejIwSEFZSEIzbkNyWnNVNURFK3FvYVd6dGRnRklxUk9JSU5EaEpTc2t2TFxuVVI5MExTZmtBQVQwaUZhd3kwT0R3SHFGOXI3MWNjUFNwdTJYTWtZT3ZZVnh1R3Vra2pLY1d6cXd4bVZoZHBWc1xuYUJpdGVTWXdEd0tCZ0MyejZnVnlTcERCbzRSSklYUlVvZng4L1dlZTViZjN4Y2JVbzF4bmladkFNRGVabEhzRFxuNzlkMTFaOUZHcVNyUXJGNWFjQ0hGOUYrTU1VUy9ZdGYzU2hUN0dqMVdhSTZsbVljYWNVQkxnV1NNYVhVYjl6blxub1hzOEZCbGJ0Ump2UnR4YUR3Z210TnZpallVUjk3dzZFQkp6enJkVjF3T2ZDdHdONEoyWjJjL2pBb0dCQUw3blxuQWRtcG9aUnE0YkQwOEhFMllLUEVENHd1M21TcjcvWmpzYm4rT0wrd1pLQTN5UE1JUkJxTjE1MzVYaGhiUkZma1xuVnpOTTV4L2pXU09mMGxKeDhtYjV2OUxxMzlOM1h0R1FNZWM1TERoSklDYk1Fenk2dHhrNmVUeU9hQTZuTVovbVxuNUdmNGw2MUpYajRuMHhRSjZoSUN5enBTWGFQNXFQSHJBUFlOdnZsWEFvR0FJRDlyUnNNNHZIdWF5WUwvYno5VVxucHlsUCtreXZ4Zm5POTRPN1JOMGxtN0VvMlRyTzJDWVRVQytnaEV4UEVLV1ptSWY5QUpFUVI5ZVQybE10S2Z6clxudDYrdEZmYmtoVzFvYVF0VW40VjNzTUsxd1M5WG1rc2tpdmdZYTlPd3RUMGl6djVVNmlwWHBTek5pNHIxelk1Q1xudzlaVlV4ZDFPV3NSNWRDVi85QWJubUk9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAibXlnb29nbGVwbGF5aW50aWdyaXR5QG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTU5ODMxNzM5NjkzMzUxMzQ4NTEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L215Z29vZ2xlcGxheWludGlncml0eSU0MG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=';

// Decode base64 credentials at runtime

/*
const getGcpCredentials = () => {
  try {
    console.warn('[GCP] Starting credentials decode from base64');

    let decoded = Buffer.from(GCP_CREDENTIALS_BASE64, 'base64').toString('utf-8').trim();

    // 🔧 Strip surrounding single or double quotes if present
    if (
      (decoded.startsWith("'") && decoded.endsWith("'")) ||
      (decoded.startsWith('"') && decoded.endsWith('"'))
    ) {
      decoded = decoded.slice(1, -1).trim();
    }

    console.warn('[GCP] Decoded credentials string (length: ' + decoded.length + ')');
    const creds = JSON.parse(decoded);
    console.warn('[GCP] Credentials parsed successfully, project_id: ' + creds.project_id);
    return creds;
  } catch (error: any) {
    console.warn('[GCP] Credentials decode failed: ' + error.message);
    throw new Error(`[CREDENTIALS_DECODE_ERROR] Failed to decode GCP credentials: ${error.message}`);
  }
};
 */

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

// POST: Test endpoint - just echo body
export async function POST(request: Request) {
  try {
    console.warn('[POST] TEST - Request received');
    
    // STEP 1: Test parsing body
    console.warn('[POST] TEST - Attempting to parse JSON body');
    const body = await request.json();
    console.warn('[POST] TEST - Body parsed successfully');
    console.warn('[POST] TEST - Body keys:', Object.keys(body));
    
    // Just echo back what we got
    return NextResponse.json({
      success: true,
      message: 'POST endpoint works - body received',
      received: body
    });
    
    // TODO: Comment back in step by step
    // Step 2: Validate token
    // Step 3: Decode credentials
    // Step 4: Call Google API
    
  } catch (error: any) {
    console.warn('[POST] TEST - Error:', error.message);
    console.warn('[POST] TEST - Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}
