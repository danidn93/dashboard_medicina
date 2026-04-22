// supabase/functions/create-eval-version/index.ts
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
    const { datasetId, fileName } = await req.json();
    if(!datasetId) return json(400,{error:"datasetId requerido"});

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data:last } = await sb
      .from("eval_dataset_versions")
      .select("version_number")
      .eq("dataset_id",datasetId)
      .order("version_number",{ascending:false})
      .limit(1)
      .maybeSingle();

    const versionNumber = (last?.version_number ?? 0) + 1;

    const { data, error } = await sb
      .from("eval_dataset_versions")
      .insert({
        dataset_id: datasetId,
        version_number: versionNumber,
        file_name: fileName ?? null,
      })
      .select("id")
      .single();

    if(error) throw error;

    return json(200,{versionId:data.id});
  }catch(e:any){
    return json(500,{error:e.message});
  }
});
