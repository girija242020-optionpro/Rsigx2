import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import webpush from "web-push";

dotenv.config();

const app = express();
app.use(cors({
  origin: (process.env.FRONTEND_ORIGIN || "*") === "*" ? true : process.env.FRONTEND_ORIGIN.split(",").map(s=>s.trim()),
  credentials: false
}));
app.use(express.json({limit:"256kb"}));

const PORT = Number(process.env.PORT || 10000);
let subscriptions = new Map();

function ensureVapid() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    const keys = webpush.generateVAPIDKeys();
    console.log("\n=== NEW VAPID KEYS ===");
    console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
    console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
    console.log("VAPID_SUBJECT=" + (process.env.VAPID_SUBJECT || "mailto:admin@example.com"));
    console.log("======================\n");
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}
ensureVapid();

app.get("/", (req,res)=>res.json({
  service:"SITARAM Alarm Backend",
  status:"ONLINE",
  purpose:"Web Push / PWA alarm bridge",
  subscriptions:subscriptions.size
}));

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  service:"sitaram-alarm-backend",
  pushConfigured:!!process.env.VAPID_PUBLIC_KEY,
  subscriptions:subscriptions.size,
  time:new Date().toISOString()
}));

app.get("/api/vapid-public-key",(req,res)=>res.json({publicKey:process.env.VAPID_PUBLIC_KEY}));

app.post("/api/subscribe",(req,res)=>{
  const sub=req.body?.subscription || req.body;
  if(!sub?.endpoint) return res.status(400).json({ok:false,error:"Invalid push subscription"});
  const id=sub.endpoint;
  subscriptions.set(id,sub);
  res.json({ok:true,subscriptions:subscriptions.size});
});

app.delete("/api/subscribe",(req,res)=>{
  const endpoint=req.body?.endpoint;
  if(endpoint) subscriptions.delete(endpoint);
  res.json({ok:true,subscriptions:subscriptions.size});
});

app.post("/api/test-push",async(req,res)=>{
  const title=req.body?.title || "SITARAM TEST";
  const body=req.body?.body || "PWA alarm backend is working.";
  const payload=JSON.stringify({title,body,tag:"sitaram-test",timestamp:Date.now()});
  let sent=0,removed=0,errors=[];
  for(const [id,sub] of subscriptions.entries()){
    try {
      await webpush.sendNotification(sub,payload);
      sent++;
    } catch(e) {
      errors.push({endpoint:id.slice(0,80),status:e.statusCode||0});
      if(e.statusCode===404 || e.statusCode===410){subscriptions.delete(id);removed++;}
    }
  }
  res.json({ok:true,sent,removed,errors});
});

app.post("/api/push",async(req,res)=>{
  const title=req.body?.title || "SITARAM ALERT";
  const body=req.body?.body || "Signal alert";
  const tag=req.body?.tag || "sitaram-alert";
  const payload=JSON.stringify({title,body,tag,timestamp:Date.now(),data:req.body?.data||{}});
  let sent=0,removed=0,errors=[];
  for(const [id,sub] of subscriptions.entries()){
    try {
      await webpush.sendNotification(sub,payload,{TTL:120});
      sent++;
    } catch(e) {
      errors.push({endpoint:id.slice(0,80),status:e.statusCode||0});
      if(e.statusCode===404 || e.statusCode===410){subscriptions.delete(id);removed++;}
    }
  }
  res.json({ok:true,sent,removed,errors});
});

// Optional transparent health check for an existing market-data backend.
app.get("/api/data-backend-health",async(req,res)=>{
  const target=(process.env.DATA_BACKEND_URL||"").replace(/\/+$/,"");
  if(!target) return res.status(503).json({ok:false,error:"DATA_BACKEND_URL not configured"});
  try{
    const r=await fetch(target,{headers:{"accept":"application/json"}});
    const text=await r.text();
    res.status(r.status).type(r.headers.get("content-type")||"text/plain").send(text);
  }catch(e){
    res.status(502).json({ok:false,error:String(e)});
  }
});

app.listen(PORT,()=>console.log(`SITARAM Alarm Backend listening on ${PORT}`));
