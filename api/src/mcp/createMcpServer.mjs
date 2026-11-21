import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AppError } from '../errors/AppError.mjs';
import { registrationSchema } from '../routes/schemas.mjs';
import { eventService } from '../services/eventService.mjs';
import { registrationService } from '../services/registrationService.mjs';

const asText = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const asError = (message) => ({ isError: true, content: [{ type: 'text', text: message }] });

function summarize(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    capacity: event.capacity,
    registered: event.registered,
    spotsLeft: event.spotsLeft,
  };
}

export function createMcpServer() {
  const server = new McpServer({ name: 'campus-events', version: '1.0.0' });

  server.registerTool(
    'get_upcoming_events',
    {
      title: 'Get upcoming events',
      description:
        'List all campus events that have not started yet, with seats left. ' +
        'Use this to find the id of an event before registering someone.',
    },
    async () => asText((await eventService.listWithCounts('upcoming')).map(summarize)),
  );

  server.registerTool(
    'get_past_events',
    {
      title: 'Get past events',
      description: 'List all campus events that have already started or finished.',
    },
    async () => asText((await eventService.listWithCounts('past')).map(summarize)),
  );

  server.registerTool(
    'register_for_event',
    {
      title: 'Register a person for an event',
      description:
        'Register one person for one event. Needs the event id (find it with get_upcoming_events), ' +
        "the person's full name and email address. Ask the user for the email if you do not have it.",
      inputSchema: {
        eventId: z.number().int().positive().describe('Id of the event to register for'),
        name: z.string().describe("The person's full name"),
        email: z.string().describe("The person's email address"),
      },
    },
    async ({ eventId, name, email }) => {
      const parsed = registrationSchema.safeParse({ name, email });
      if (!parsed.success) {
        return asError(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
      }
      try {
        await registrationService.register(eventId, parsed.data);
        const event = await eventService.getWithCounts(eventId);
        return asText({ registered: true, event: event.title, spotsLeft: event.spotsLeft });
      } catch (error) {
        if (error instanceof AppError) return asError(error.message);
        throw error;
      }
    },
  );

  return server;
}