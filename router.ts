export type Handler = (
  request: Request,
  match: URLPatternResult,
) =>
  | Response
  | null
  | undefined
  | void
  | PromiseLike<Response | null | undefined | void>;

export class Route {
  #pattern: URLPattern;
  #userEndpoints: Record<string, Handler> | null;
  #endpoints: Map<string, Handler>;
  constructor(
    pattern: URLPattern,
    endpoints: Record<string, Handler> | Iterable<[string, Handler]>,
  ) {
    this.#pattern = pattern;
    if (Symbol.iterator in endpoints) {
      const endpoints2 = endpoints as Iterable<[string, Handler]>;
      this.#endpoints = new Map(endpoints2);
      this.#userEndpoints = null;
    } else {
      const endpoints2 = endpoints as Record<string, Handler>;
      this.#endpoints = new Map(
        Object.entries(endpoints2) as [string, Handler][],
      );
      this.#userEndpoints = endpoints2;
    }
  }
  test(request: Request): boolean {
    return this.#pattern.test(request.url);
  }
  async exec(request: Request): Promise<Response | null> {
    const match = this.#pattern.exec(request.url);
    if (match == null) {
      return null;
    }
    const handler = this.#endpoints.get(request.method);
    if (handler == null) {
      return null;
    }
    const response = await handler.call(this.#userEndpoints, request, match);
    if (response == null) {
      return null;
    }
    return response;
  }
}

export default class Router {
  #routes: Route[];
  constructor(routes: Iterable<Route>) {
    this.#routes = [...routes];
  }
  test(request: Request): boolean {
    for (const route of this.#routes) {
      if (route.test(request)) {
        return true;
      }
    }
    return false;
  }
  async exec(request: Request): Promise<Response | null> {
    for (const route of this.#routes) {
      const response = await route.exec(request);
      if (response != null) {
        return response;
      }
    }
    return null;
  }
  fetch = async (request: Request): Promise<Response> => {
    for (const route of this.#routes) {
      let response: Response | null;
      try {
        response = await route.exec(request);
      } catch (error) {
        console.error(error);
        response = new Response(null, { status: 500 });
      }
      if (response != null) {
        return response;
      }
    }
    return new Response(null, { status: 404 });
  };
}
