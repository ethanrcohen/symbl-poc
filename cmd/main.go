package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/ethanrcohen/symbl-poc/cmd/handler"
	"github.com/hokaccha/go-prettyjson"
	"github.com/joho/godotenv"
	"github.com/symblai/symbl-go-sdk/pkg/api/nebula/v1"
	microphone "github.com/symblai/symbl-go-sdk/pkg/audio/microphone"
	symbl "github.com/symblai/symbl-go-sdk/pkg/client"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	symbl.Init(symbl.SybmlInit{
		LogLevel: symbl.LogLevelStandard, // LogLevelStandard, LogLevelFull, LogLevelTrace, LogLevelVerbose
	})

	ctx := context.Background()

	// init library
	microphone.Initialize()

	// create a new client
	cfg := symbl.GetDefaultConfig()
	cfg.Speaker.Name = "Ethan Cohen"
	cfg.Speaker.UserID = "ethan@mymail.com"
	cfg.Config.DetectEntities = true
	cfg.Config.Sentiment = true

	// cfg.Trackers = append(cfg.Trackers, cfginterfaces.Tracker{
	// 	Name:       "MyTest1",
	// 	Vocabulary: []string{"value1", "value2"},
	// })
	// cfg.Trackers = append(cfg.Trackers, cfginterfaces.Tracker{
	// 	Name:       "MyTest2",
	// 	Vocabulary: []string{"value1", "value2"},
	// })

	restClient, err := symbl.NewNebulaRestClient(ctx)
	if err != nil {
		fmt.Printf("NewNebulaRestClient failed. Err: %v\n", err)
		os.Exit(1)
	}
	nebulaClient := nebula.New(restClient)
	msgHandler := handler.NewHandler(handler.HandlerOptions{
		NebulaClient: nebulaClient,
	})

	data, err := json.Marshal(cfg)
	if err != nil {
		fmt.Printf("TeardownConversation json.Marshal failed. Err: %v\n", err)
		os.Exit(1)
	}
	prettyJson, err := prettyjson.Format(data)
	if err != nil {
		fmt.Printf("prettyjson.Marshal failed. Err: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("\nJSON:\n\n%s\n\n", prettyJson)

	options := symbl.StreamingOptions{
		SymblConfig: cfg,
		Callback:    msgHandler,
	}

	client, err := symbl.NewStreamClient(ctx, options)
	if err == nil {
		fmt.Println("Login Succeeded!")
	} else {
		fmt.Printf("New failed. Err: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("ConversationID: %s\n", client.GetConversationId())

	err = client.Start()
	if err == nil {
		fmt.Printf("Streaming Session Started!\n")
	} else {
		fmt.Printf("client.Start failed. Err: %v\n", err)
		os.Exit(1)
	}

	// delay...
	time.Sleep(time.Second * 2)

	// mic stuf
	mic, err := microphone.New(microphone.AudioConfig{
		InputChannels: 1,
		SamplingRate:  16000,
	})
	if err != nil {
		fmt.Printf("Initialize failed. Err: %v\n", err)
		os.Exit(1)
	}

	// start the mic
	err = mic.Start()
	if err != nil {
		fmt.Printf("mic.Start failed. Err: %v\n", err)
		os.Exit(1)
	}

	go func() {
		// this is a blocking call
		mic.Stream(client)
	}()

	fmt.Print("Press ENTER to exit!\n\n")
	input := bufio.NewScanner(os.Stdin)
	input.Scan()

	// close stream
	err = mic.Stop()
	if err != nil {
		fmt.Printf("mic.Stop failed. Err: %v\n", err)
		os.Exit(1)
	}

	// teardown library
	microphone.Teardown()

	// close client
	client.Stop()

	fmt.Printf("Succeeded!\n\n")

}
