// netlify/functions/init-app.ts
import { NetlifyFunctionsResponse, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const INITIAL_APP_DATA = {
  schemaVersion: "1.2.0",
  updatedAt: new Date().toISOString(),
  app: {
    metadata: {
      name: "Team Hunt",
      environment: "production",
      uiVersion: "1.0.0"
    },
    features: {
      enableKVEvents: true,
      enableBlobEvents: true,
      enablePhotoUpload: true,
      enableMapPage: false
    },
    defaults: {
      timezone: "America/Denver",
      locale: "en-US"
    },
    limits: {
      maxUploadSizeMB: 10,
      maxPhotosPerTeam: 100,
      allowedMediaTypes: ["image/jpeg", "image/png", "image/webp"]
    }
  },
  organizations: [
    {
      orgSlug: "bhhs",
      orgName: "Berkshire Hathaway HomeServices", 
      primaryContactEmail: "contact@bhhs.com",
      createdAt: new Date().toISOString(),
      orgBlobKey: "orgs/bhhs.json",
      summary: {
        huntsTotal: 1,
        teamsCommon: ["RED", "BLUE", "GREEN", "PINK"]
      }
    }
  ],
  byDate: {
    [new Date().toISOString().split('T')[0]]: [
      {
        orgSlug: "bhhs",
        huntId: "vail-hunt-2025"
      }
    ]
  }
};

export const handler = async (event: HandlerEvent, context: HandlerContext): Promise<NetlifyFunctionsResponse> => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Method Not Allowed - use POST" })
      };
    }

    console.log('🚀 Initializing app.json in production...');

    const store = getStore("kv");
    
    // Check if app.json already exists
    console.log('🔍 Checking if app.json already exists...');
    const existing = await store.getJSON('app.json');
    
    if (existing !== null) {
      console.log('⚠️ app.json already exists');
      return {
        statusCode: 409,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "app.json already exists",
          message: "Use force=true to overwrite",
          timestamp: new Date().toISOString()
        }),
      };
    }
    
    // Create app.json
    console.log('💾 Creating app.json...');
    await store.setJSON('app.json', INITIAL_APP_DATA);
    
    // Verify it was stored
    const verification = await store.getJSON('app.json');
    
    if (!verification) {
      throw new Error('Failed to verify app.json creation');
    }
    
    console.log('✅ Successfully initialized app.json');
    
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "app.json initialized successfully",
        data: {
          schemaVersion: INITIAL_APP_DATA.schemaVersion,
          organizationCount: INITIAL_APP_DATA.organizations.length,
          dateEntries: Object.keys(INITIAL_APP_DATA.byDate).length
        },
        timestamp: new Date().toISOString(),
        testUrl: "https://teamhunt.pro/.netlify/functions/kv-get?key=app.json"
      }),
    };
    
  } catch (err: any) {
    console.error(`❌ Error in init-app:`, err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: String(err?.message || err),
        timestamp: new Date().toISOString()
      }),
    };
  }
};