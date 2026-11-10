"use client";

const OFFLINE_MESSAGE = "این قابلیت در نسخه نمایشی آفلاین غیرفعال است.";

function offlineError() {
  const error = new Error(OFFLINE_MESSAGE);
  error.code = "OFFLINE_MODE";
  return error;
}

export function getAccessToken() {
  return null;
}

export function setAccessToken() {
  // Authentication tokens are not used in offline demo mode.
}

export function clearAccessToken() {
  // Authentication tokens are not used in offline demo mode.
}

export async function refreshAccessToken() {
  throw offlineError();
}

export async function apiFetch() {
  throw offlineError();
}

export async function apiUpload() {
  throw offlineError();
}
