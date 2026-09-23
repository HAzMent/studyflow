
import express from "express";

import {
  createClient
} from "@supabase/supabase-js";


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

        autoRefreshToken:false,

        detectSessionInUrl:false

      }

    }
  );

}


function requireStudyFlowUser(
  req,
  res
){

  if(
    !req.session ||
    !req.session.userId
  ){

    res
    .status(401)
    .json({

      error:
        "Login required."

    });


    return false;

  }


  return true;

}


/* ========================================================
   STATUS
======================================================== */

router.get(
  "/status",

  async (req,res) => {

    if(
      !requireStudyFlowUser(
        req,
        res
      )
    ){

      return;

    }


    const supabase =
      getSupabase();


    if(!supabase){

      return res.json({

        configured:false,

        connected:false,

        message:
          "Supabase is not configured yet."

      });

    }


    try{

      const {
        data,
        error
      } =
        await supabase

        .from(
          "studyflow_snapshots"
        )

        .select(
          "updated_at"
        )

        .eq(
          "user_key",
          String(
            req.session.userId
          )
        )

        .maybeSingle();


      if(error){

        return res.json({

          configured:true,

          connected:false,

          setupRequired:true,

          message:
            error.message

        });

      }


      return res.json({

        configured:true,

        connected:true,

        exists:!!data,

        updatedAt:
          data?.updated_at || null

      });


    }catch(error){

      console.error(
        "Cloud status:",
        error
      );


      return res
      .status(500)
      .json({

        configured:true,

        connected:false,

        error:
          error.message

      });

    }

  }
);


/* ========================================================
   PUSH
======================================================== */

router.post(
  "/push",

  async (req,res) => {

    if(
      !requireStudyFlowUser(
        req,
        res
      )
    ){

      return;

    }


    const supabase =
      getSupabase();


    if(!supabase){

      return res
      .status(503)
      .json({

        error:
          "Cloud Sync is not configured."

      });

    }


    const snapshot =
      req.body?.snapshot;


    if(
      !snapshot ||
      typeof snapshot !== "object"
    ){

      return res
      .status(400)
      .json({

        error:
          "Invalid cloud snapshot."

      });

    }


    try{

      const now =
        new Date()
        .toISOString();


      const {
        data,
        error
      } =
        await supabase

        .from(
          "studyflow_snapshots"
        )

        .upsert(
          {

            user_key:
              String(
                req.session.userId
              ),

            data:
              snapshot,

            updated_at:
              now

          },

          {

            onConflict:
              "user_key"

          }

        )

        .select(
          "updated_at"
        )

        .single();


      if(error){

        throw error;

      }


      res.json({

        success:true,

        updatedAt:
          data.updated_at

      });


    }catch(error){

      console.error(
        "Cloud push:",
        error
      );


      res
      .status(500)
      .json({

        error:
          error.message ||
          "Cloud upload failed."

      });

    }

  }
);


/* ========================================================
   PULL
======================================================== */

router.get(
  "/pull",

  async (req,res) => {

    if(
      !requireStudyFlowUser(
        req,
        res
      )
    ){

      return;

    }


    const supabase =
      getSupabase();


    if(!supabase){

      return res
      .status(503)
      .json({

        error:
          "Cloud Sync is not configured."

      });

    }


    try{

      const {
        data,
        error
      } =
        await supabase

        .from(
          "studyflow_snapshots"
        )

        .select(
          "data,updated_at"
        )

        .eq(
          "user_key",
          String(
            req.session.userId
          )
        )

        .maybeSingle();


      if(error){

        throw error;

      }


      if(!data){

        return res.json({

          exists:false

        });

      }


      res.json({

        exists:true,

        snapshot:
          data.data,

        updatedAt:
          data.updated_at

      });


    }catch(error){

      console.error(
        "Cloud pull:",
        error
      );


      res
      .status(500)
      .json({

        error:
          error.message ||
          "Cloud download failed."

      });

    }

  }
);


export default router;

