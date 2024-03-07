const { sdk, SpeakerEvent } = require("@symblai/symbl-js");

const { SYMBL_APP_ID: appId, SYMBL_APP_SECRET: appSecret } = process.env;

// parse connection id from command line
const connectionId = btoa("test-call-id");

sdk.init({
    // APP_ID and APP_SECRET come from the Symbl Platform: https://platform.symbl.ai
    appId,
    appSecret,
})
    .then(async () => {
        console.log("SDK initialized.");
        try {
            // You code goes here.
        } catch (e) {
            console.error(e);
        }
    })
    .catch((err: any) => console.error("Error in SDK initialization.", err));

// Subscribe to connection using connectionId.
sdk.subscribeToConnection(connectionId, (data: any) => {
    const { type } = data;
    if (type === "transcript_response") {
        const { payload } = data;

        // You get live transcription here!!
        process.stdout.write("Live: " + payload && payload.content + "\r");
    } else if (type === "message_response") {
        const { messages } = data;

        // You get processed messages in the transcript here!!! Real-time but not live! :)
        messages.forEach((message: any) => {
            process.stdout.write("Message: " + message.payload.content + "\n");
        });
    } else if (type === "insight_response") {
        const { insights } = data;
        // See <link here> for more details on Insights
        // You get any insights here!!!
        insights.forEach((insight: any) => {
            process.stdout.write(
                `Insight: ${insight.type} - ${insight.text} \n\n`
            );
        });
    }
});
