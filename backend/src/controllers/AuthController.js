import { loginUser, registerUser, requestPasswordReset } from "../services/authService.js";

export async function register(request, response, next) {
  try {
    const result = await registerUser(request.body, "USER");
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const result = await loginUser(request.body);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(request, response, next) {
  try {
    const result = await requestPasswordReset(request.body.email);
    response.json(result);
  } catch (error) {
    next(error);
  }
}
