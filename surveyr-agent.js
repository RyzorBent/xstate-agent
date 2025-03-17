const { z } = require('zod');
const { createAgent, fromDecision } = require('@statelyai/agent');
const { google } = require('@ai-sdk/google');
const { assign, createActor, setup } = require('xstate');
const { fromTerminal } = require('./helpers/helpers');
const dotenv = require('dotenv');

dotenv.config();

const VERBOSE = false;
const LOGGING = false;

const agent = createAgent({
  name: 'market_research_agent',
  description:
    'A research assistant chatbot conducting in-depth interviews on the impact of AI on market research methodologies.',
  model: google('gemini-2.0-flash-001'),
  events: {
    askQuestion: z.object({
      question: z.string().describe('Exact question from the questionnaire'),
    }),
    probeResponse: z.object({
      followUp: z.string().describe('Follow-up question to explore context'),
    }),
    transitionMessage: z.object({
      message: z.string().describe('Transition message to next question'),
    }),
    complete: z.object({}).describe('End the questionnaire'),
  },
});

// Add system message to set the agent's behavior
agent.addMessage({
  role: 'system',
  content: `You are a helpful research assistant chatbot. Your primary mission is to conduct in-depth research interviews on the impact of AI on market research methodologies.

Maintain focus on questions related to AI tools, research processes, market research, future of research, and researcher roles.

If a user introduces topics irrelevant to market research and AI's impact, such as unrelated news, personal opinions on unrelated subjects, or attempts to change the subject drastically, you should:

1. Acknowledge: Briefly acknowledge their input with phrases like "That's interesting," "I understand," or simply by reflecting back a short part of their statement.
2. Remind: Politely remind them of the interview's focus with phrases like "For our research today, we're focusing on...", "To keep our interview on track...", "As part of this research interview...", or "Let's get back to our discussion about...".
3. Redirect: Gently redirect the conversation back to the research questions or the next question in the interview flow. Use phrases like "Could we now discuss...", "Moving on to the next question...", "Let's delve deeper into...", or simply re-ask the last unanswered research question or introduce the next one.
4. [Optional - if appropriate]: If the off-topic item is somewhat related, you could say something like "While that's related to broader tech discussions, for this interview, let's keep our focus specifically on AI in market research."

Your responses should be polite, professional, and helpful, even when redirecting. The goal is to complete the research interview effectively while being respectful to the interviewee.`,
});

const machine = setup({
  actors: {
    fromTerminal: fromTerminal,
    fromDecision: fromDecision(agent),
  },
}).createMachine({
  context: {
    questions: [
      '*[1 of 3]* What interests you most about the BMW iX electric SUV?',
      '*[2 of 3]* How important is sustainability and environmental impact in your car buying decision?',
      '*[3 of 3]* What features would you expect from a luxury electric SUV like the BMW iX?',
    ],
    currentQuestionIndex: 0,
    answers: [],
    probingCount: 0,
    conversationHistory: [],
  },
  initial: 'engagement',
  states: {
    engagement: {
      initial: 'asking',
      states: {
        asking: {
          invoke: {
            src: 'fromDecision',
            input: ({ context }) => ({
              agent,
              context,
              goal:
                context.probingCount === 0
                  ? `Ask this exact question: "${context.questions[context.currentQuestionIndex]}"`
                  : context.probingCount < 3
                  ? `Based on the user's response: "${
                      context.conversationHistory.slice(-1)[0]
                    }", create a follow-up question that explores their perspective deeper, focusing on specific examples, challenges, or opportunities they see in AI's impact on market research.`
                  : `Based on the conversation history: "${context.conversationHistory.join(
                      '\n'
                    )}", create a brief transition that acknowledges the key points discussed and naturally leads into the next topic about ${context.questions[
                      context.currentQuestionIndex + 1
                    ]
                      .toLowerCase()
                      .replace(/^\*\[\d of \d\]\*\s*/, '')} without asking the question directly.`,
            }),
          },
          on: {
            askQuestion: {
              actions: [
                ({ event }) => console.log(`\nAI: ${event.question}`),
                assign({
                  conversationHistory: ({ context, event }) => [
                    ...context.conversationHistory,
                    `AI: ${event.question}`,
                  ],
                }),
              ],
              target: 'listening',
            },
            probeResponse: {
              actions: [
                ({ event }) => console.log(`\nAI: ${event.followUp}`),
                assign({
                  conversationHistory: ({ context, event }) => [
                    ...context.conversationHistory,
                    `AI: ${event.followUp}`,
                  ],
                }),
              ],
              target: 'listening',
            },
            transitionMessage: {
              actions: [
                ({ event }) => console.log(`\nAI: ${event.message}`),
                assign({
                  conversationHistory: ({ context, event }) => [
                    ...context.conversationHistory,
                    `AI: ${event.message}`,
                  ],
                }),
              ],
              target: '#nextQuestion',
            },
            complete: '#done',
          },
        },
        listening: {
          invoke: {
            src: 'fromTerminal',
            input: 'You: ',
            onDone: {
              actions: [
                assign({
                  answers: ({ context, event }) =>
                    context.probingCount === 0
                      ? [...context.answers, event.output]
                      : context.answers,
                  conversationHistory: ({ context, event }) => [
                    ...context.conversationHistory,
                    `User: ${event.output}`,
                  ],
                  probingCount: ({ context }) => context.probingCount + 1,
                }),
              ],
              target: 'analyzing',
            },
          },
        },
        analyzing: {
          always: [
            {
              guard: ({ context }) =>
                context.probingCount > 3 &&
                context.currentQuestionIndex >= context.questions.length - 1,
              target: '#done',
            },
            { target: 'asking' },
          ],
        },
        transition: {
          entry: [
            assign({
              currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1,
              probingCount: () => 0,
            }),
          ],
          after: {
            2000: 'asking',
          },
        },
      },
    },
    nextQuestion: {
      id: 'nextQuestion',
      entry: assign({
        currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1,
        probingCount: () => 0,
      }),
      always: [
        {
          guard: ({ context }) => context.currentQuestionIndex >= context.questions.length,
          target: 'done',
        },
        { target: 'engagement' },
      ],
    },
    done: {
      id: 'done',
      entry: ({ context }) => {
        console.log('\n=== Emotional Insights ===');
        context.questions.forEach((q, i) => {
          console.log(`\nQ: ${q}`);
          console.log(`A: ${context.answers[i]}`);
          console.log(
            context.conversationHistory.filter((entry) => entry.includes('Probe')).join('\n')
          );
        });
      },
      type: 'final',
    },
  },
});

const actor = createActor(machine).start();

if(LOGGING)
actor.subscribe((snapshot) => {
  console.log(
    '\n\n----------------------------- current state context -----------------------------'
  );
  console.log({
    status: snapshot.status,
    value: snapshot.value,
    probingCount: snapshot.context.probingCount,
  });
  console.log(
    '---------------------------------------------------------------------------------\n\n'
  );
});
if(LOGGING)
agent.subscribe((state) => {
  if(VERBOSE)
  console.log({ agentMessages: agent.getMessages() });
  if (state.context.plans.length > 0) {
    const decision = state.context.plans[state.context.plans.length - 1];
    if (decision) {
      // Store previous decision in closure to compare
      const prevDecision = (() => {
        let prev = null;
        return (current) => {
          const changed = !prev || 
            prev.state?.value !== current.state?.value ||
            prev.nextEvent !== current.nextEvent ||
            prev.goal !== current.goal;
          prev = current;
          return changed;
        };
      })();

      if (prevDecision(decision)) {
        console.log(
          '\n\n----------------------------- agent decisions -----------------------------'
        );
        console.log('Latest decision:', {
          value: decision.state?.value,
          nextEvent: decision.nextEvent,
          goal: decision.goal,
        });
        console.log(
          '----------------------------------------------------------------------------\n\n'
        );
      }
    }
  }
});
