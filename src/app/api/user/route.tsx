import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

// Helper function to construct the GraphQL endpoint
const getGraphqlEndpoint = (): string => {
  const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
  const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
  return `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
};

// GET handler to fetch a user by email
export async function GET(req: NextRequest) {
  try {
    // Authenticate request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Get email query parameter
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Construct GraphQL query to fetch user by email
    const graphqlEndpoint = getGraphqlEndpoint();
    const query = `
      query {
        user(email: "${email}") {
          id
          firstname
          lastname
          emailaddress1
        }
      }
    `;
    const response = await axios.post(
      graphqlEndpoint,
      { query },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const user = response.data.data?.user;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

// POST handler to create a new user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields: email or name" },
        { status: 400 }
      );
    }
    const graphqlEndpoint = getGraphqlEndpoint();
    const mutation = `
      mutation {
        createUser(input: { email: "${body.email}", name: "${body.name}" }) {
          user {
            id
            firstname
            lastname
            emailaddress1
          }
        }
      }
    `;
    const response = await axios.post(
      graphqlEndpoint,
      { query: mutation },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const newUser = response.data.data?.createUser?.user;
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing user
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.id || !body.email || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields: id, email, or name" },
        { status: 400 }
      );
    }
    const graphqlEndpoint = getGraphqlEndpoint();
    const mutation = `
      mutation {
        updateUser(input: { id: "${body.id}", email: "${body.email}", name: "${body.name}" }) {
          user {
            id
            firstname
            lastname
            emailaddress1
          }
        }
      }
    `;
    const response = await axios.post(
      graphqlEndpoint,
      { query: mutation },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const updatedUser = response.data.data?.updateUser?.user;
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// PUSH handler to add new data (alias for creating a user)
export async function PUSH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields: email or name" },
        { status: 400 }
      );
    }
    const graphqlEndpoint = getGraphqlEndpoint();
    const mutation = `
      mutation {
        pushUser(input: { email: "${body.email}", name: "${body.name}" }) {
          user {
            id
            firstname
            lastname
            emailaddress1
          }
        }
      }
    `;
    const response = await axios.post(
      graphqlEndpoint,
      { query: mutation },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const pushedUser = response.data.data?.pushUser?.user;
    return NextResponse.json(pushedUser, { status: 201 });
  } catch (error) {
    console.error("Error pushing user:", error);
    return NextResponse.json({ error: "Failed to push user" }, { status: 500 });
  }
}
