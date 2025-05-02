import { Handler } from "aws-lambda";
import { SQS } from "aws-sdk";

const sqs = new SQS();
const QUEUE_B_URL = process.env.QUEUE_B_URL!;

export const handler: Handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const records = event.Records || [];
    for (const record of records) {
      let snsMsg;
      if (record.Sns && record.Sns.Message) {
        snsMsg = JSON.parse(record.Sns.Message);
      } else if (record.body) {
        snsMsg = JSON.parse(record.body);
      } else {
        continue;
      }
      if (!snsMsg.email) {
        await sqs
          .sendMessage({
            QueueUrl: QUEUE_B_URL,
            MessageBody: JSON.stringify(snsMsg),
          })
          .promise();
        console.log("Sent to Queue B:", snsMsg);
      }
    }
  } catch (error: any) {
    throw new Error(JSON.stringify(error));
  }
};
