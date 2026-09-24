
import express from "express";

import bcrypt from "bcryptjs";

import crypto from "crypto";

import {
  createClient
} from "@supabase/supabase-js";

import {
  Resend
} from "resend";


const router =
  express.Router();


function getSupabase(){

  const url =
    process.env.SUPABASE_URL;


  const secret =
    process.env.SUPABASE_SECRET_KEY
    ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;


  if(
    !url ||
    !secret
  ){

    return null;

  }


  return createClient(
    url,
    secret,
    {

      auth:{

        persistSession:false,

        autoRefreshToken:false

      }

    }
  );

}


function normalizeEmail(value){

  return String(
    value || ""
  )
  .trim()
  .toLowerCase();

}


function createRawToken(){

  return crypto
    .randomBytes(32)
    .toString("hex");

}


function hashToken(token){

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

}


function appUrl(req){

  return (
    process.env.APP_URL
    ||
    `${req.protocol}://${req.get("host")}`
  )
  .replace(/\/$/,"");

}


async function saveToken(
  supabase,
  userId,
  type,
  hours
){

  /*
    Remove older unused tokens
    of the same type.
  */

  await supabase

    .from(
      "studyflow_auth_tokens"
    )

    .delete()

    .eq(
      "user_id",
      userId
    )

    .eq(
      "token_type",
      type
    )

    .is(
      "used_at",
      null
    );


  const rawToken =
    createRawToken();


  const tokenHash =
    hashToken(
      rawToken
    );


  const expires =
    new Date(
      Date.now()
      +
      hours *
      60 *
      60 *
      1000
    );


  const {
    error
  } =
    await supabase

    .from(
      "studyflow_auth_tokens"
    )

    .insert({

      user_id:
        userId,

      token_hash:
        tokenHash,

      token_type:
        type,

      expires_at:
        expires.toISOString()

    });


  if(error){

    throw error;

  }


  return rawToken;

}


async function sendStudyFlowEmail({

  to,
  subject,
  html

}){

  const apiKey =
    process.env.RESEND_API_KEY;


  const from =
    process.env.RESEND_FROM_EMAIL;


  if(
    !apiKey ||
    !from
  ){

    return false;

  }


  const resend =
    new Resend(
      apiKey
    );


  const {
    error
  } =
    await resend.emails.send({

      from,

      to,

      subject,

      html

    });


  if(error){

    console.error(
      "Email error:",
      error
    );


    return false;

  }


  return true;

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

router.post(
  "/forgot-password",

  async (req,res) => {

    const supabase =
      getSupabase();


    /*
      Always return the same response.
      This prevents account enumeration.
    */

    const genericResponse = {

      success:true,

      message:
        "If an account exists for that email, password reset instructions have been sent."

    };


    if(!supabase){

      return res.json(
        genericResponse
      );

    }


    const email =
      normalizeEmail(
        req.body?.email
      );


    if(!email){

      return res.json(
        genericResponse
      );

    }


    try{

      const {
        data:user,
        error
      } =
        await supabase

        .from(
          "studyflow_users"
        )

        .select(
          "id,email,name"
        )

        .eq(
          "email",
          email
        )

        .maybeSingle();


      if(error){

        throw error;

      }


      if(!user){

        return res.json(
          genericResponse
        );

      }


      const token =
        await saveToken(
          supabase,
          user.id,
          "reset_password",
          1
        );


      const resetUrl =
        `${appUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;


      const emailSent =
        await sendStudyFlowEmail({

          to:
            user.email,

          subject:
            "Reset your StudyFlow password",

          html:`

            <div style="
              font-family:
              Arial,
              sans-serif;
              max-width:560px;
              margin:auto;
              color:#171923;
            ">

              <h1>
                Reset your StudyFlow password
              </h1>

              <p>
                Hi ${user.name || "there"},
              </p>

              <p>
                We received a request to reset
                your StudyFlow password.
              </p>

              <p style="margin:30px 0">

                <a
                  href="${resetUrl}"
                  style="
                    background:#635bff;
                    color:#fff;
                    text-decoration:none;
                    padding:13px 20px;
                    border-radius:9px;
                    font-weight:bold;
                  "
                >
                  Reset Password
                </a>

              </p>

              <p>
                This link expires in 1 hour.
              </p>

              <p>
                If you did not request this,
                you can ignore this email.
              </p>

            </div>

          `

        });


      /*
        During LOCAL development only,
        print reset URL to Terminal.

        Never expose this URL in production.
      */

      if(
        !emailSent &&
        process.env.NODE_ENV !==
        "production"
      ){

        console.log("");
        console.log(
          "🔑 DEV RESET LINK:"
        );

        console.log(
          resetUrl
        );

        console.log("");

      }


      return res.json(
        genericResponse
      );


    }catch(error){

      console.error(
        "Forgot password:",
        error
      );


      return res.json(
        genericResponse
      );

    }

  }
);


/* =========================================================
   RESET PASSWORD
========================================================= */

router.post(
  "/reset-password",

  async (req,res) => {

    const supabase =
      getSupabase();


    if(!supabase){

      return res
        .status(503)
        .json({

          error:
            "Authentication service unavailable."

        });

    }


    const token =
      String(
        req.body?.token ||
        ""
      );


    const password =
      String(
        req.body?.password ||
        ""
      );


    if(password.length < 8){

      return res
        .status(400)
        .json({

          error:
            "Password must be at least 8 characters."

        });

    }


    if(!token){

      return res
        .status(400)
        .json({

          error:
            "Reset token is missing."

        });

    }


    try{

      const tokenHash =
        hashToken(
          token
        );


      const {
        data:record,
        error
      } =
        await supabase

        .from(
          "studyflow_auth_tokens"
        )

        .select(
          "id,user_id,expires_at,used_at"
        )

        .eq(
          "token_hash",
          tokenHash
        )

        .eq(
          "token_type",
          "reset_password"
        )

        .maybeSingle();


      if(error){

        throw error;

      }


      if(
        !record ||
        record.used_at ||
        new Date(
          record.expires_at
        ).getTime() <
        Date.now()
      ){

        return res
          .status(400)
          .json({

            error:
              "This password reset link is invalid or has expired."

          });

      }


      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );


      const {
        error:updateError
      } =
        await supabase

        .from(
          "studyflow_users"
        )

        .update({

          password_hash:
            passwordHash,

          updated_at:
            new Date()
            .toISOString()

        })

        .eq(
          "id",
          record.user_id
        );


      if(updateError){

        throw updateError;

      }


      await supabase

        .from(
          "studyflow_auth_tokens"
        )

        .update({

          used_at:
            new Date()
            .toISOString()

        })

        .eq(
          "id",
          record.id
        );


      /*
        Remove other reset tokens.
      */

      await supabase

        .from(
          "studyflow_auth_tokens"
        )

        .delete()

        .eq(
          "user_id",
          record.user_id
        )

        .eq(
          "token_type",
          "reset_password"
        )

        .neq(
          "id",
          record.id
        );


      return res.json({

        success:true,

        message:
          "Password changed successfully."

      });


    }catch(error){

      console.error(
        "Reset password:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Could not reset password."

        });

    }

  }
);


/* =========================================================
   SEND EMAIL VERIFICATION
========================================================= */

router.post(
  "/send-verification",

  async (req,res) => {

    if(
      !req.session?.userId
    ){

      return res
        .status(401)
        .json({

          error:
            "Login required."

        });

    }


    const supabase =
      getSupabase();


    if(!supabase){

      return res
        .status(503)
        .json({

          error:
            "Authentication service unavailable."

        });

    }


    try{

      const {
        data:user,
        error
      } =
        await supabase

        .from(
          "studyflow_users"
        )

        .select(
          "id,email,name,email_verified"
        )

        .eq(
          "id",
          req.session.userId
        )

        .single();


      if(error){

        throw error;

      }


      if(user.email_verified){

        return res.json({

          success:true,

          alreadyVerified:true

        });

      }


      const token =
        await saveToken(
          supabase,
          user.id,
          "verify_email",
          24
        );


      const verifyUrl =
        `${appUrl(req)}/api/verify-email?token=${encodeURIComponent(token)}`;


      const sent =
        await sendStudyFlowEmail({

          to:
            user.email,

          subject:
            "Verify your StudyFlow email",

          html:`

            <div style="
              font-family:
              Arial,
              sans-serif;
              max-width:560px;
              margin:auto;
            ">

              <h1>
                Verify your email
              </h1>

              <p>
                Welcome to StudyFlow.
              </p>

              <p>

                <a
                  href="${verifyUrl}"
                  style="
                    display:inline-block;
                    background:#635bff;
                    color:white;
                    text-decoration:none;
                    padding:13px 20px;
                    border-radius:9px;
                    font-weight:bold;
                  "
                >
                  Verify Email
                </a>

              </p>

              <p>
                This link expires in 24 hours.
              </p>

            </div>

          `

        });


      if(
        !sent &&
        process.env.NODE_ENV !==
        "production"
      ){

        console.log(
          "📧 DEV VERIFY LINK:",
          verifyUrl
        );

      }


      return res.json({

        success:true,

        emailSent:
          sent

      });


    }catch(error){

      console.error(
        "Send verification:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Could not send verification email."

        });

    }

  }
);


/* =========================================================
   VERIFY EMAIL
========================================================= */

router.get(
  "/verify-email",

  async (req,res) => {

    const supabase =
      getSupabase();


    if(!supabase){

      return res
        .status(503)
        .send(
          "Authentication service unavailable."
        );

    }


    const token =
      String(
        req.query?.token ||
        ""
      );


    try{

      const tokenHash =
        hashToken(
          token
        );


      const {
        data:record,
        error
      } =
        await supabase

        .from(
          "studyflow_auth_tokens"
        )

        .select(
          "id,user_id,expires_at,used_at"
        )

        .eq(
          "token_hash",
          tokenHash
        )

        .eq(
          "token_type",
          "verify_email"
        )

        .maybeSingle();


      if(error){

        throw error;

      }


      if(
        !record ||
        record.used_at ||
        new Date(
          record.expires_at
        ).getTime() <
        Date.now()
      ){

        return res.redirect(
          "/app?verification=invalid"
        );

      }


      const {
        error:updateError
      } =
        await supabase

        .from(
          "studyflow_users"
        )

        .update({

          email_verified:true,

          updated_at:
            new Date()
            .toISOString()

        })

        .eq(
          "id",
          record.user_id
        );


      if(updateError){

        throw updateError;

      }


      await supabase

        .from(
          "studyflow_auth_tokens"
        )

        .update({

          used_at:
            new Date()
            .toISOString()

        })

        .eq(
          "id",
          record.id
        );


      return res.redirect(
        "/app?verification=success"
      );


    }catch(error){

      console.error(
        "Verify email:",
        error
      );


      return res.redirect(
        "/app?verification=error"
      );

    }

  }
);


export default router;

