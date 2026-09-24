
import express from "express";
import bcrypt from "bcryptjs";

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


  if(!url || !secret){
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


function cleanEmail(value){

  return String(value || "")
    .trim()
    .toLowerCase();

}


function publicUser(user){

  return {

    id:user.id,

    email:user.email,

    name:user.name || "",

    university:user.university || "",

    major:user.major || ""

  };

}


function requireDatabase(res){

  const supabase =
    getSupabase();


  if(!supabase){

    res.status(503).json({
      error:
        "Supabase account storage is not configured."
    });

    return null;

  }


  return supabase;

}


/* =========================================================
   REGISTER
========================================================= */

router.post(
  "/register",

  async (req,res) => {

    const supabase =
      requireDatabase(res);


    if(!supabase){
      return;
    }


    const email =
      cleanEmail(req.body?.email);


    const password =
      String(
        req.body?.password || ""
      );


    const name =
      String(
        req.body?.name || ""
      ).trim();


    if(!email.includes("@")){

      return res
        .status(400)
        .json({
          error:
            "Enter a valid email address."
        });

    }


    if(password.length < 6){

      return res
        .status(400)
        .json({
          error:
            "Password must be at least 6 characters."
        });

    }


    try{

      const {
        data:existing,
        error:findError
      } =
        await supabase

        .from(
          "studyflow_users"
        )

        .select(
          "id"
        )

        .eq(
          "email",
          email
        )

        .maybeSingle();


      if(findError){
        throw findError;
      }


      if(existing){

        return res
          .status(409)
          .json({
            error:
              "An account with this email already exists."
          });

      }


      const password_hash =
        await bcrypt.hash(
          password,
          12
        );


      const {
        data:user,
        error
      } =
        await supabase

        .from(
          "studyflow_users"
        )

        .insert({

          email,

          password_hash,

          name:
            name ||
            email.split("@")[0],

          university:"",

          major:""

        })

        .select(
          "id,email,name,university,major"
        )

        .single();


      if(error){
        throw error;
      }


      req.session.userId =
        user.id;


      req.session.save(
        () => {

          res.json({
            user:
              publicUser(user)
          });

        }
      );


    }catch(error){

      console.error(
        "Supabase register:",
        error
      );


      res
        .status(500)
        .json({
          error:
            error.message ||
            "Could not create account."
        });

    }

  }
);


/* =========================================================
   LOGIN
========================================================= */

router.post(
  "/login",

  async (req,res) => {

    const supabase =
      requireDatabase(res);


    if(!supabase){
      return;
    }


    const email =
      cleanEmail(
        req.body?.email
      );


    const password =
      String(
        req.body?.password || ""
      );


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
          "id,email,password_hash,name,university,major"
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

        return res
          .status(401)
          .json({
            error:
              "Incorrect email or password."
          });

      }


      const valid =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if(!valid){

        return res
          .status(401)
          .json({
            error:
              "Incorrect email or password."
          });

      }


      req.session.userId =
        user.id;


      req.session.save(
        () => {

          res.json({
            user:
              publicUser(user)
          });

        }
      );


    }catch(error){

      console.error(
        "Supabase login:",
        error
      );


      res
        .status(500)
        .json({
          error:
            error.message ||
            "Login failed."
        });

    }

  }
);


/* =========================================================
   LOGOUT
========================================================= */

router.post(
  "/logout",

  (req,res) => {

    req.session.destroy(
      () => {

        res.json({
          success:true
        });

      }
    );

  }
);


/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",

  async (req,res) => {

    if(!req.session?.userId){

      return res
        .status(401)
        .json({
          error:
            "Not logged in."
        });

    }


    const supabase =
      requireDatabase(res);


    if(!supabase){
      return;
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
          "id,email,name,university,major"
        )

        .eq(
          "id",
          req.session.userId
        )

        .maybeSingle();


      if(error){
        throw error;
      }


      if(!user){

        req.session.destroy(
          () => {}
        );


        return res
          .status(401)
          .json({
            error:
              "Account no longer exists."
          });

      }


      res.json({
        user:
          publicUser(user)
      });


    }catch(error){

      console.error(
        "Supabase /me:",
        error
      );


      res
        .status(500)
        .json({
          error:
            error.message
        });

    }

  }
);


/* =========================================================
   PROFILE
========================================================= */

router.put(
  "/profile",

  async (req,res) => {

    if(!req.session?.userId){

      return res
        .status(401)
        .json({
          error:
            "Login required."
        });

    }


    const supabase =
      requireDatabase(res);


    if(!supabase){
      return;
    }


    const update = {

      updated_at:
        new Date()
        .toISOString()

    };


    if(
      typeof req.body?.name ===
      "string"
    ){

      update.name =
        req.body.name.trim();

    }


    if(
      typeof req.body?.university ===
      "string"
    ){

      update.university =
        req.body.university.trim();

    }


    if(
      typeof req.body?.major ===
      "string"
    ){

      update.major =
        req.body.major.trim();

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

        .update(update)

        .eq(
          "id",
          req.session.userId
        )

        .select(
          "id,email,name,university,major"
        )

        .single();


      if(error){
        throw error;
      }


      res.json({
        user:
          publicUser(user)
      });


    }catch(error){

      console.error(
        "Profile update:",
        error
      );


      res
        .status(500)
        .json({
          error:
            error.message ||
            "Profile update failed."
        });

    }

  }
);


export default router;

