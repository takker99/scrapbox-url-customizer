import { createErr, createOk, type Result } from "option-t/plain_result";
import type { HTTPError } from "@cosense/std/rest";

export const makeHTTPError = (
  response: Response,
): Result<Response, HTTPError> =>
  response.ok ? createOk(response) : createErr({
    name: "HTTPError",
    message: `${response.status} ${response.statusText}`,
    response,
  });
