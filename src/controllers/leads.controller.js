import prisma from "../config/database.js";
export async function listLeads(_req,res,next){try{res.json(await prisma.lead.findMany({orderBy:{createdAt:"desc"}}));}catch(e){next(e);}}
export async function getLead(req,res,next){try{const row=await prisma.lead.findUnique({where:{id:req.params.id}});return row?res.json(row):res.status(404).json({error:"Lead não encontrado."});}catch(e){return next(e);}}
export async function createLead(req,res,next){try{return res.status(201).json(await prisma.lead.create({data:req.body}));}catch(e){return next(e);}}
export async function updateLead(req,res,next){try{return res.json(await prisma.lead.update({where:{id:req.params.id},data:req.body}));}catch(e){return next(e);}}
export async function deleteLead(req,res,next){try{await prisma.lead.delete({where:{id:req.params.id}});return res.status(204).send();}catch(e){return next(e);}}
