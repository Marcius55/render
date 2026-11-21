import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { logger } from '../config/logger.mjs';
import { createMcpServer } from '../mcp/createMcpServer.mjs';

const jsonRpcError = (code, message) => ({ jsonrpc: '2.0', error: { code, message }, id: null });

export const mcpController = {
  async handle(req, res) {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error(error.message, { stack: error.stack });
      if (!res.headersSent) {
        res.status(500).json(jsonRpcError(-32603, 'Internal server error'));
      }
    }
  },

  methodNotAllowed(req, res) {
    res.status(405).set('Allow', 'POST').json(jsonRpcError(-32000, 'Method not allowed. Use POST.'));
  },
};