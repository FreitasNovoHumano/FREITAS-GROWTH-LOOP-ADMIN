import Lead from "../models/Lead.js";
export async function listLeads(_req,res,next){try{res.json(await Lead.findAll({order:[["createdAt","DESC"]]}));}catch(e){next(e);}}
export async function getLead(req,res,next){try{const row=await Lead.findByPk(req.params.id);return row?res.json(row):res.status(404).json({error:"Lead nao encontrado."});}catch(e){return next(e);}}
export async function createLead(req,res,next){try{return res.status(201).json(await Lead.create(req.body));}catch(e){return next(e);}}
export async function updateLead(req,res,next){try{const row=await Lead.findByPk(req.params.id);if(!row)return res.status(404).json({error:"Lead nao encontrado."});await row.update(req.body);return res.json(row);}catch(e){return next(e);}}
export async function deleteLead(req,res,next){try{const row=await Lead.findByPk(req.params.id);if(!row)return res.status(404).json({error:"Lead nao encontrado."});await row.destroy();return res.status(204).send();}catch(e){return next(e);}}
