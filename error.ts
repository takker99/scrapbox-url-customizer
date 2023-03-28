export interface HTTPError {
  name: "HTTPError";
  message: string;
  response: Response;
}

export const makeHTTPError = (response: Response): HTTPError | undefined =>
  response.ok ? undefined : ({
    name: "HTTPError",
    message: `${response.status} ${response.statusText}`,
    response,
  });
