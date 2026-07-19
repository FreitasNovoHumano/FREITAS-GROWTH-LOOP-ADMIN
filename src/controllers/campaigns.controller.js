import prisma from "../config/database.js";
export async function listCampaigns(_req,res,next){try{res.json(await prisma.growthLoopCampaign.findMany({orderBy:{createdAt:"desc"}}));}catch(e){next(e);}}
export async function getCampaign(req,res,next){try{const row=await prisma.growthLoopCampaign.findUnique({where:{id:req.params.id}});return row?res.json(row):res.status(404).json({error:"Campanha não encontrada."});}catch(e){return next(e);}}
export async function createCampaign(req,res,next){try{return res.status(201).json(await prisma.growthLoopCampaign.create({data:req.body}));}catch(e){return next(e);}}
export async function updateCampaign(req,res,next){try{return res.json(await prisma.growthLoopCampaign.update({where:{id:req.params.id},data:req.body}));}catch(e){return next(e);}}
export async function deleteCampaign(req,res,next){try{await prisma.growthLoopCampaign.delete({where:{id:req.params.id}});return res.status(204).send();}catch(e){return next(e);}}
