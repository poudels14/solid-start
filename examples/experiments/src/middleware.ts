import { createMiddleware } from "@solidjs/start/server";

export default createMiddleware({
  onRequest: [
    event => {
      console.log("REQUEST", event.request.url);
    }
  ],
  onBeforeResponse: [
    (event, { body }) => {
      console.log("BEFORE RESPONSE", body);
    }
  ]
});
