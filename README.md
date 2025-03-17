# XState Emotional Survey Agent

A conversational AI agent built with XState and Google's Gemini model that conducts emotionally intelligent surveys about BMW iX electric SUV preferences.

## Overview

This project demonstrates the use of state machines to create an intelligent survey agent that:

- Asks predefined questions about BMW iX preferences
- Probes deeper with empathetic follow-up questions
- Analyzes emotional context in responses
- Provides smooth transitions between questions
- Generates insights from the conversation

## Prerequisites

- Node.js (v14 or higher)
- A Google AI API key for the Gemini model

## Setup

1. Clone the repository:

```bash
git clone https://github.com/RyzorBent/xstate-agent.git
cd xstate-agent
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your Google AI API key:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## Usage

Run the survey agent:

```bash
node surveyr-agent
```

The agent will:

1. Ask a series of questions about the BMW iX
2. Generate empathetic follow-up questions based on your responses
3. Provide smooth transitions between topics
4. Display emotional insights at the end of the survey

## Survey Flow

The agent conducts a 3-question survey about:

1. Interest in the BMW iX electric SUV
2. Importance of sustainability in car buying decisions
3. Expected features in a luxury electric SUV

For each question, the agent:

- Asks the main question
- Probes deeper with up to 3 follow-up questions
- Provides a transition to the next topic
- Captures emotional context and motivations

## Technologies Used

- [XState](https://xstate.js.org/) - State machine management
- [@statelyai/agent](https://github.com/statelyai/agent) - AI agent framework
- [Google Gemini AI](https://ai.google.dev/) - Language model
- [Zod](https://github.com/colinhacks/zod) - Runtime type checking

## Project Structure

- `surveyr-agent.js` - Main application file containing the state machine and agent logic
- `.env` - Environment variables configuration
- `helpers/` - Helper functions and utilities

## License

MIT
