import { NestFactory } from '@nestjs/core';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';
import { AppModule } from './app.module';

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this
// is likely due to a compressed response (e.g. gzip) which has not
// been handled correctly by aws-serverless-express and/or API
// Gateway. Add the necessary MIME types to binaryMimeTypes below
const binaryMimeTypes = [];

let cachedServer;

// Create the Nest.js server and convert it into an Express.js server
async function bootstrapServer() {
  if (!cachedServer) {
    const nestApp = await NestFactory.create(AppModule);
    nestApp.use(eventContext());
    await nestApp.init();
    cachedServer = createServer(
      nestApp.getHttpServer(),
      undefined,
      binaryMimeTypes,
    );
  }
  return cachedServer;
}

// Export the handler : the entry point of the Lambda function
export async function handler(event, context) {
  cachedServer = await bootstrapServer();
  return proxy(cachedServer, event, context, 'PROMISE').promise;
}
