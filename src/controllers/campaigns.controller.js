import Campaign from "../models/Campaign.js";
export async function listCampaigns(_req,res,next){try{res.json(await Campaign.findAll({order:[["createdAt","DESC"]]}));}catch(e){next(e);}}
export async function getCampaign(req,res,next){try{const row=await Campaign.findByPk(req.params.id);return row?res.json(row):res.status(404).json({error:"Campanha nao encontrada."});}catch(e){return next(e);}}
export async function createCampaign(req,res,next){try{return res.status(201).json(await Campaign.create(req.body));}catch(e){return next(e);}}
export async function updateCampaign(req,res,next){try{const row=await Campaign.findByPk(req.params.id);if(!row)return res.status(404).json({error:"Campanha nao encontrada."});await row.update(req.body);return res.json(row);}catch(e){return next(e);}}
export async function deleteCampaign(req,res,next){try{const row=await Campaign.findByPk(req.params.id);if(!row)return res.status(404).json({error:"Campanha nao encontrada."});await row.destroy();return res.status(204).send();}catch(e){return next(e);}}
