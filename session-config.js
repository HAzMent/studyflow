
import session from "express-session";

import pg from "pg";

import connectPgSimple
from "connect-pg-simple";


const {
  Pool
} = pg;


export function createSessionMiddleware(){

  const secret =
    process.env.SESSION_SECRET;


  if(!secret){

    throw new Error(
      "SESSION_SECRET is missing."
    );

  }


  const databaseUrl =
    process.env.DATABASE_URL;


  let store;


  if(databaseUrl){

    const pool =
      new Pool({

        connectionString:
          databaseUrl,

        ssl:{
          rejectUnauthorized:false
        }

      });


    const PgSession =
      connectPgSimple(
        session
      );


    store =
      new PgSession({

        pool,

        tableName:
          "studyflow_sessions",

        createTableIfMissing:
          true

      });


    console.log(
      "✅ Persistent Postgres sessions enabled"
    );

  }else{

    console.warn(
      "⚠ DATABASE_URL missing — using development MemoryStore"
    );

  }


  return session({

    store,

    name:
      "studyflow.sid",

    secret,

    resave:false,

    saveUninitialized:false,

    rolling:true,

    cookie:{

      httpOnly:true,

      sameSite:"lax",

      secure:
        process.env.NODE_ENV ===
        "production",

      maxAge:
        1000 *
        60 *
        60 *
        24 *
        30

    }

  });

}

