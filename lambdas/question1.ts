import { APIGatewayProxyHandler, APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    // Check if this is a GET request to /crew/movies/{movieId}
    if (event.httpMethod === "GET") {
      const movieId = event.pathParameters?.movieId;
      const role = event.queryStringParameters?.role;

      if (!movieId) {
        return {
          statusCode: 400,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ error: "Missing movieId or role parameter" }),
        };
      }

      console.log("movieId: ", movieId);
      console.log("role: ", role);

      if (role) {
        const command = new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
            movieId: parseInt(movieId),
            role: role,
          },
        });

        const response = await client.send(command);

        console.log("response: ", response.Item);

        if (!response.Item) {
          return {
            statusCode: 404,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ error: "Crew member not found" }),
          };
        }

        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(response.Item),
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Invalid request",
      }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
