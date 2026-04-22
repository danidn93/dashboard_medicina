// supabase/functions/insert-eval-raw/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (s:number,b:any)=>
  new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});

serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json(405,{error:"Method not allowed"});

  try{
    const { versionId, sheetName, startRow, rows } = await req.json();
    if(!versionId||!sheetName||!Array.isArray(rows))
      return json(400,{error:"payload inválido"});

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = rows.map((r:any,i:number)=>({
      version_id: versionId,
      sheet_name: sheetName,
      row_number: startRow + i + 1,
      data: r,
    }));

    const { error } = await sb.from("eval_import_raw").insert(payload);
    if(error) throw error;

    return json(200,{inserted:payload.length});
  }catch(e:any){
    return json(500,{error:e.message});
  }
});
