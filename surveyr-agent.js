const { z } = require('zod');
const { createAgent, fromDecision } = require('@statelyai/agent');
const { google } = require('@ai-sdk/google');
const { assign, createActor, setup } = require('xstate');
const { fromTerminal } = require('./helpers/helpers');
const dotenv = require('dotenv');

dotenv.config();

const agent = createAgent({
  id: 'emotional_probe',
  model: google('gemini-2.0-flash-001'),
  events: {
    askQuestion: z.object({
      question: z.string().describe('Exact question from the questionnaire'),
    }),
    probeResponse: z.object({
      followUp: z.string().describe('Empathetic follow-up question to explore emotional context'),
    }),
    transitionMessage: z.object({
      message: z.string().describe('Transition message to next question'),
    }),
    complete: z.object({}).describe('End the questionnaire'),
  },
  context: {
    questions: z.array(z.string()),
    currentQuestionIndex: z.number(),
    answers: z.array(z.string()),
    probingCount: z.number(),
    conversationHistory: z.array(z.string()),
  },
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
                  ? `Analyze this response for emotional context: "${
                      context.conversationHistory.slice(-1)[0]
                    }". Create an empathetic follow-up question that explores deeper feelings and motivations. Focus on emotional aspects like desires, concerns, or personal values.`
                  : `Based on the conversation history: "${context.conversationHistory.join(
                      '\n'
                    )}", create a very brief transition message that: 1) Acknowledges the key themes from our discussion so far 2) Naturally leads into the topic of ${context.questions[
                      context.currentQuestionIndex + 1
                    ]
                      .toLowerCase()
                      .replace(
                        '*question_' + (context.currentQuestionIndex + 2) + '*',
                        ''
                      )} without actually asking the question`,
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

actor.subscribe((snapshot) => {
  console.log(
    '\n\n----------------------------- current state context -----------------------------'
  );
  console.log({ status: snapshot.status, value: snapshot.value, probingCount: snapshot.context.probingCount });
  console.log(
    '---------------------------------------------------------------------------------\n\n'
  );
});

// agent.subscribe((state) => {
//     if (state.context.plans.length > 0) {
//         const decision = state.context.plans[state.context.plans.length - 1];
//         if (decision) {
//               console.log('\n\n----------------------------- agent decisions -----------------------------');
//               console.log('Latest decision:', {
//                 value: decision.state?.value,
//                 nextEvent: decision.nextEvent,
//                 goal: decision.goal,
//               });
//               console.log('----------------------------------------------------------------------------\n\n');
//         }
//     }
// })

console.log('agentPlan: ', agent.getPlans());
