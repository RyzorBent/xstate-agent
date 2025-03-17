# XState AI Market Research Agent

A conversational AI agent built with XState and Google's Gemini model that conducts intelligent research interviews about the impact of AI on market research methodologies.

## Overview

This project demonstrates the use of state machines to create an intelligent research agent that:

- Conducts structured research interviews on any topic
- Maintains focus through gentle redirection
- Probes deeper with contextual follow-up questions
- Provides smooth transitions between topics
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

Run the research agent:

```bash
node surveyr-agent
```

The agent will:

1. Ask a series of questions about AI's impact on market research
2. Generate relevant follow-up questions based on your responses
3. Keep the conversation focused on the research topic
4. Provide smooth transitions between questions
5. Display research insights at the end of the interview

## Interview Flow

The agent conducts a 3-question interview about:

1. How AI tools are transforming traditional market research methodologies
2. Challenges in integrating AI into existing research processes
3. Evolution of market researcher roles with AI adoption

For each question, the agent:

- Asks the main research question
- Probes deeper with up to 3 follow-up questions
- Maintains focus on AI and market research topics
- Provides smooth transitions between topics
- Captures key insights and context

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
