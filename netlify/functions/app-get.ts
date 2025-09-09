// netlify/functions/app-get.ts
import { NetlifyFunctionsResponse, HandlerEvent, HandlerContext } from "@netlify/functions";
import { AzureTableOrgRepoAdapter } from "../../src/infra/storage/azure.table.adapter";

export const handler = async (event: HandlerEvent, context: HandlerContext): Promise<NetlifyFunctionsResponse> => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "GET") {
      return { 
        statusCode: 405, 
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const { key } = event.queryStringParameters || {};
    
    if (!key) {
      return { 
        statusCode: 400, 
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing key parameter" })
      };
    }

    console.log(`📖 Reading from Azure Tables: ${key}`);

    // Only handle app.json requests
    if (key !== 'app.json') {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          error: "Key not found - only app.json is supported",
          key,
          timestamp: new Date().toISOString()
        }),
      };
    }

    const orgAdapter = new AzureTableOrgRepoAdapter();
    
    try {
      const appResult = await orgAdapter.getApp();
      
      if (!appResult) {
        console.log(`❌ App data not found: ${key}`);
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            error: "App data not found",
            key,
            timestamp: new Date().toISOString()
          }),
        };
      }

      console.log(`✅ Successfully retrieved app data`);

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          key,
          value: appResult.data,
          timestamp: new Date().toISOString()
        }),
      };
      
    } catch (error: any) {
      // Handle "not found" errors specifically
      if (error.message?.includes('not found') || error.statusCode === 404) {
        console.log(`❌ App data not found: ${key}`);
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            error: "App data not found",
            key,
            timestamp: new Date().toISOString()
          }),
        };
      }
      
      throw error;
    }
    
  } catch (err: any) {
    console.error(`❌ Error in app-get:`, err);
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