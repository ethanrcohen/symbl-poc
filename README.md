# Symbl-poc

proof concept for Symbl integration, non-phi use case for exploration purposes

## Runbook

To run, first make sure you have "sox" installed -- this allows the microphone input library to work. Run `brew install sox` if on Mac.

Relatedly, if on Mac, make sure that your terminal application has permissions to access your microphone.

Copy `env.template` to `.env` and fill in the requisite values.

Then, run `tsc && yarn start` to be able to talk into your mic. If just looking to subscribe to events, use `yarn subscribe`.
