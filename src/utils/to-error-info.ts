import {
  isHTTPError,
  isKyError,
  isNetworkError,
  isTimeoutError,
  SchemaValidationError,
} from "ky";

export type ErrorInfo = {
  code:
    | "NETWORK"
    | "TIMEOUT"
    | "AUTH_EXPIRED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "SERVER"
    | "INVALID_RESPONSE"
    | "UNKNOWN";
  message: string;
  detail?: string;
  recoveryAction:
    | "retry"
    | "refresh-auth"
    | "redirect-login"
    | "contact-support"
    | "none";
};

export function toErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof SchemaValidationError) {
    return {
      code: "INVALID_RESPONSE",
      message: "데이터를 불러오는 중 문제가 발생했어요.",
      detail: error.message,
      recoveryAction: "contact-support",
    };
  }

  if (isTimeoutError(error)) {
    return {
      code: "TIMEOUT",
      message: "응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.",
      detail: error.message,
      recoveryAction: "retry",
    };
  }

  if (isNetworkError(error)) {
    return {
      code: "NETWORK",
      message: "인터넷 연결을 확인한 뒤 다시 시도해주세요.",
      detail: error.message,
      recoveryAction: "retry",
    };
  }

  if (isHTTPError(error)) {
    const status = error.response.status;

    switch (status) {
      case 401:
        return {
          code: "AUTH_EXPIRED",
          message: "로그인이 만료됐어요. 다시 로그인해주세요.",
          detail: error.message,
          recoveryAction: "refresh-auth",
        };

      case 403:
        return {
          code: "FORBIDDEN",
          message: "이 기능은 현재 사용할 수 없어요.",
          detail: error.message,
          recoveryAction: "none",
        };

      case 404:
        return {
          code: "NOT_FOUND",
          message: "요청하신 정보를 찾을 수 없어요.",
          detail: error.message,
          recoveryAction: "none",
        };

      case 429:
        return {
          code: "RATE_LIMITED",
          message: "요청이 많아요. 잠시 후 다시 시도해주세요.",
          detail: error.message,
          recoveryAction: "retry",
        };

      default:
        if (status >= 500) {
          return {
            code: "SERVER",
            message: "일시적인 오류가 발생했어요. 다시 시도해주세요.",
            detail: error.message,
            recoveryAction: "retry",
          };
        }
    }
  }

  if (isKyError(error)) {
    return {
      code: "UNKNOWN",
      message: "문제가 발생했어요. 다시 시도해주세요.",
      detail: error.message,
      recoveryAction: "retry",
    };
  }

  return {
    code: "UNKNOWN",
    message: "문제가 발생했어요. 다시 시도해주세요.",
    recoveryAction: "none",
  };
}
