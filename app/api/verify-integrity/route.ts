import { NextResponse } from 'next/server';
import { playintegrity } from '@googleapis/playintegrity';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const getSecret = () => process.env.HMAC_SECRET || 'fallback-secret-key-change-in-env';

const GCP_SERVICE_ACCOUNT_KEY_BASE64 = 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibXlnaW50aWdyaXR5IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiZGQ1MWQ3ZmMzNGEwMDE2OWVmNGViODg0Yzc2NTllZGViZTIzYWRkZiIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFDMTRYbGRsRHA3cVhJWVxuaERXdFc1MHpOdXAwMTRXaXhlK2RJODNNQWdRUTVQL1oyak9qc1lVY0xnaTVtYnQ5c3o2d0lJd0lUVlJJTHlUR1xuTUZkaHNBYThLRXN1RFpYQVJkbzI0ODNIWGo5QnU1Zm9RUkFWNjVPMW1LcUdoZm5FZVIwenVjY0ZpMmRLbklaUVxuTkYycGdPaGg2dDdGUFZhampWYmF0Tm5tdEgwaXEzNmZpUGxqa3c4VDUyUmNGVDBwbmdEWGdRYWtYLzFCUkl3SlxudTdjKzJaRk9jamNlOENlU21NS2ZwaHhjNGNtTXpZSHhEK2JTTTZ0Z1N4dFBQaW51R0NXN3Bid3dEUWxJTUU5VFxuSzVmck1CeGdsZEEzcy9Rb2JMWnpyYkNTUnBQb2xicktZM0dsMGpoSk41d2k4clZFY2F2MDJJSVBPSXZOdkF6ZFxuWEt1eklyN1JBZ01CQUFFQ2dnRUFDZnNzS2w4Q2tKdTlaNndGdUJSQmZiaURTRk0xZ2JmRURRY1VlYUFZc2dhblxuSmNEc09ZejU1WkIvS1JSUExqaENkZTdyVUY5U0F6NFhFZ3RBR0Z2Tkd0RkpRdWM2OHhqQ1AyWGorbzlwQUVYM1xuc2FhMFo4ZU1UUmhxTDBTMTdyckl4L2huZkIzbzFyYmRSaFNCbVZZNktubDFyVFJQQjEydnlRUEl1M2puTHhwTFxuZHFhRG5tY0NWaU05eUNRRU5PSENUQklkZmNlZDR3UWc0T0pZTWRURDFvR1ZPSW5ZSTU4SEZRMEFPcnNBS3U3c1xuZndURHhLNEhVZHhzYUhJeE9xZW1sSWp3eWRvRmRWWkN5YWhwZXpVd1ErUWZzZVFteU9RclB6czdUWjdqLzFaZFxuVlJEL0h2Zkw0Mno4OEUvR2lyRXcxYzNXYUg3OWJXbHQvbmRZQWxrZmd3S0JnUURtR2NyYTR5RERHWHZPMkZnL1xuVS9tV2JrZTRxU0RHakFQcmZGbUl6RnF3WHg2VUhwSlpwZzJKVkxlT1MySkFUZSszVmxFQmFsdXc3T09Tdi9oNlxuR3RwRUhrQ05tck1CVHhkWnpnRk1tVkwxR01sRnlXU3VJNDltV2lNRFpkUXdzTDhRUStaM1gzQ08xdUJMaHZMVFxucVdLY0h5K2hqQUlheEtoNFZBcmJmait5M3dLQmdRREtXa0RKZTVqY0NXWHVVZ2g5T0EwdUswU0MxeDEvZXYyQ1xuK2RpdzZJUDB2VUhLTnBESzNaNmtQRXhpNFlxMyt1c1NVcDhYKzdNYllTbzZZSnM3cTNYaUs4bzhLSFdYYVZWUFxubythZ252Q29wUi9ReXFRMjloa1BGV291SUpUZHRBVzlaSjVaRGRXcEV5Nkp5QXQrZlVuMkxLcFNNd2tJc1MzUlxuSGthanhzTDBUd0tCZ1FDRFNtQTJ1TFh1M0ZHS1dtTXY3eWhRTHloNU12ZGlrbTJDSmZlb1dJRytkT2VydUMzbFxuUFJ3b0tkQjZQb1VYRCtFaGlQeTdoQVpCVTBrZWFLN01iUm54R0JuWk1sWEUvMjNoYmV2TDJ3ZzhsU0h5MGREQ1xuazhPMHNPV2RnTEtyL1kxbktIY04wY1VWbTRGclZ0cWk3dGszSDR3Nzd2a2NjTzEzaXV5UEJPQXZuUUtCZ1FDZ1xuUSs5QUpQWWlnQWNOUkVlWTlZWHE1VFh6OHZCWUFVODhKeW9xbzEydnZ4MldUTFZORjA0SWdnRjE1M0I0MnZESFxucUV4OU1FcmhDb25waG80c0tsYkpkU2xOa0RYaVgvakRoT3FxbUhlKytsbENndHlnOHpWUnJ3SlQybFpOYWNHS1xuQ1dFbzR6NHdGUk1zNlJYQmJ2WGZWZXpvQWFmTURKaGZJZjJNeFdXdkhRS0JnRTVSZFQ0bHB3ZmxKeEVPNzZxK1xudTE4R0gxdlUxb21lR0lhUWtKL0pxQkdYTEJUREMzU0p1cU9oTmZQNTIyd1VrWmlwTGhMeWlPUXNpSVVHazVsTlxucE0wNTNrTGNPd1FocTRkSFlBTkpqOVRXVmp0cVJOc1IwalREbUh4VWwrL0cwbTBHSmtocEd5SGJwYkNKemVjclxuMGpDc2VsL2o5NUVoYmxWQjNZbStYSE1sXG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAibXlnb29nbGVwbGF5aW50aWdyaXR5QG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTU5ODMxNzM5NjkzMzUxMzQ4NTEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L215Z29vZ2xlcGxheWludGlncml0eSU0MG15Z2ludGlncml0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=';

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
