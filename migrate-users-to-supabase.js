
import fs from "fs";

import dotenv from "dotenv";

import {
  createClient
} from "@supabase/supabase-js";


dotenv.config();


const url =
  process.env.SUPABASE_URL;


const secret =
  process.env.SUPABASE_SECRET_KEY
  ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;


if(!url || !secret){

  console.error(
    "❌ Supabase credentials are missing from .env"
  );

  process.exit(1);

}


const supabase =
  createClient(
    url,
    secret,
    {
      auth:{
        persistSession:false
      }
    }
  );


const file =
  "data/users.json";


if(!fs.existsSync(file)){

  console.log(
    "ℹ️ No old data/users.json found."
  );

  process.exit(0);

}


let users;


try{

  users =
    JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );

}catch(error){

  console.error(
    "❌ Could not read users.json:",
    error.message
  );

  process.exit(1);

}


if(!Array.isArray(users)){

  console.error(
    "❌ users.json is not an array."
  );

  process.exit(1);

}


console.log(
  `Found ${users.length} local users.`
);


for(const oldUser of users){

  const email =
    String(
      oldUser.email || ""
    )
    .trim()
    .toLowerCase();


  if(
    !email ||
    !oldUser.passwordHash
  ){

    console.log(
      "Skipping invalid user:",
      email
    );

    continue;

  }


  const row = {

    email,

    password_hash:
      oldUser.passwordHash,

    name:
      oldUser.name || "",

    university:
      oldUser.university || "",

    major:
      oldUser.major || "",

    updated_at:
      new Date()
      .toISOString()

  };


  /*
    Preserve old numeric StudyFlow ID.
    This keeps localStorage/cloud snapshot IDs compatible.
  */

  if(
    oldUser.id !== undefined &&
    oldUser.id !== null
  ){

    row.id =
      Number(oldUser.id);

  }


  const {
    error
  } =
    await supabase

    .from(
      "studyflow_users"
    )

    .upsert(
      row,
      {
        onConflict:
          "email"
      }
    );


  if(error){

    console.error(
      `❌ ${email}:`,
      error.message
    );

  }else{

    console.log(
      `✅ ${email}`
    );

  }

}


console.log("");
console.log(
  "🎉 User migration finished."
);

