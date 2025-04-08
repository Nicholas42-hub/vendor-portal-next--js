import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req: NextRequest, context: { params: { contactid: string } }) {
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const contactid = context.params.contactid;
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    const query = {
      query: `
        query($contactid: String!) {
          vendorTradingEntities(filter: { contactid: { eq: $contactid } }) {
            items {
              contactid
              TradingEntityId
            }
          }
          contacts(filter: { contactid: { eq: $contactid } }) {
            items {
              contactid
              vendorcountry
            }
          }
        }
      `,
      variables: { contactid },
    };
    const response = await axios.post(graphqlEndpoint, query, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const contacts = response.data.data.contacts.items;
    const entities = response.data.data.vendorTradingEntities.items;

    const vendorCountry = contacts.length > 0 ? contacts[0].vendorcountry : "Unknown";
    console.log(vendorCountry)
    const relatedEntities = entities
      .filter((e: any) => e.contactid === contactid)
      .map((e: any) => ({
        contactid: e.contactid,
        TradingEntityId: e.TradingEntityId,
        paymentCountry: e.TradingEntityId.startsWith("A") ? "Australia" : e.TradingEntityId.startsWith("N") ? "New Zealand" : "Unknown"
      }));

    return NextResponse.json({ contactid, vendorCountry, tradingEntities: relatedEntities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}