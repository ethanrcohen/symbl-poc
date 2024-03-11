import { sdk } from "@symblai/symbl-js";
import mic from "mic";

const { APP_ID: appId, APP_SECRET: appSecret } = process.env;

const sampleRateHertz = 16000;
const micInstance = mic({
    rate: sampleRateHertz,
    channels: "1",
    debug: false,
    exitOnSilence: 6,
});

if (!appId || !appSecret) {
    console.error(
        "Please provide SYMBL_APP_ID and SYMBL_APP_SECRET as environment variables."
    );
    process.exit(1);
}

(async () => {
    try {
        await sdk.init({
            appId: appId,
            appSecret: appSecret,
            basePath: "https://api.symbl.ai",
        });
    } catch (e) {
        console.error("Error in SDK initialization.", e);
    }
})();

async function test() {
    // TODO: this should be changed for each unique test
    const id = btoa("test-call-id-1");
    // const id = randomUUID();

    const connection = await sdk.startRealtimeRequest({
        id,
        insightTypes: ["action_item", "question"],
        config: {
            meetingTitle: "My Test Meeting",
            confidenceThreshold: 0.7,
            timezoneOffset: 480, // Offset in minutes from UTC
            languageCode: "en-US",
            sampleRateHertz,
        },
        speaker: {
            // TODO: UPDATE HERE
            // Optional, if not specified, will simply not send an email in the end.
            userId: "ethan@getchapter.com", // Update with valid email
            name: "ethan",
        },
        handlers: {
            /**
             * This will return live speech-to-text transcription of the call.
             */
            onSpeechDetected: (data: any) => {
                if (data) {
                    const { punctuated } = data;
                    console.log("Live: ", punctuated && punctuated.transcript);
                    console.log("");
                }
                console.log("onSpeechDetected ", JSON.stringify(data, null, 2));
            },
            /**
             * When processed messages are available, this callback will be called.
             */
            onMessageResponse: (data: any) => {
                console.log("onMessageResponse", JSON.stringify(data, null, 2));
            },
            /**
             * When Symbl detects an insight, this callback will be called.
             */
            onInsightResponse: (data: any) => {
                console.log("onInsightResponse", JSON.stringify(data, null, 2));
            },
            /**
             * When Symbl detects a topic, this callback will be called.
             */
            onTopicResponse: (data: any) => {
                console.log("onTopicResponse", JSON.stringify(data, null, 2));
            },
            /**
             * When trackers are detected, this callback will be called.
             */
            onTrackerResponse: (data: any) => {
                console.log("onTrackerResponse", JSON.stringify(data, null, 2));
            },
        },
    });

    micInstance.start();
    const micInputStream = micInstance.getAudioStream();
    /** Raw audio stream */
    micInputStream.on("data", (data) => {
        console.log("Got data from Microphone: " + data.length);
        // Push audio from Microphone to websocket connection
        connection.sendAudio(data);
    });

    micInputStream.on("error", function (err) {
        console.log("Error in Input Stream: " + err);
    });

    micInputStream.on("startComplete", function () {
        console.log("Started listening to Microphone.");
    });

    micInputStream.on("silence", function () {
        console.log("Got SIGNAL silence");
    });
    setTimeout(async () => {
        // Stop listening to microphone
        micInstance.stop();
        console.log("Stopped listening to Microphone.");
        try {
            // Stop connection
            const conversationData = await connection.stop();
            console.log("Conversation ID: " + conversationData.conversationId);
            console.log("Connection Stopped.");
        } catch (e) {
            console.error("Error while stopping the connection.", e);
        }
    }, 60 * 1000); // Stop connection after 1 minute i.e. 60 secs
}

test().catch((e) => {
    console.error(e);
    process.exit(1);
});
