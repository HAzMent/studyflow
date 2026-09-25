import helmet from "helmet";
import {
  rateLimit
} from "express-rate-limit";


/*
  StudyFlow currently contains some inline scripts/styles,
  so CSP is intentionally disabled until the frontend
  is migrated to nonce/hash-based CSP.
*/

export const securityHeaders =
  helmet({
    contentSecurityPolicy:false,
    crossOriginEmbedderPolicy:false,

    referrerPolicy:{
      policy:
        "strict-origin-when-cross-origin"
    }
  });


function createLimiter({
  windowMs,
  limit,
  message
}){

  return rateLimit({

    windowMs,

    limit,

    standardHeaders:true,

    legacyHeaders:false,

    message:{
      error:message
    }

  });

}


export const loginLimiter =
  createLimiter({

    windowMs:
      15 * 60 * 1000,

    limit:10,

    message:
      "Too many login attempts. Please try again later."

  });


export const registerLimiter =
  createLimiter({

    windowMs:
      60 * 60 * 1000,

    limit:5,

    message:
      "Too many registration attempts. Please try again later."

  });


export const forgotPasswordLimiter =
  createLimiter({

    windowMs:
      15 * 60 * 1000,

    limit:5,

    message:
      "Too many password reset requests. Please try again later."

  });


export const resetPasswordLimiter =
  createLimiter({

    windowMs:
      15 * 60 * 1000,

    limit:10,

    message:
      "Too many password reset attempts. Please try again later."

  });
