import * as svc from "../services/enquiry.service.js"

export async function topEnquiryCategories(req: any, res: any){
    try{
        const data = await svc.getTop5EnquiryCategories()
        return res.json(data)
    }catch(err: any){
        return res.status(500).json({ error: err.message ?? "Server error" })
    }
}

export async function topEscalatedEnquiries(req: any, res: any){
    try{
        const data = await svc.getTop5EscalatedEnquiries()
        return res.json(data)
    }catch(err: any){
        return res.status(500).json({ error: err.message ?? "Server error" })
    }
}

export async function allEnquiryCategories(req: any, res: any){
    try{
        const data = await svc.getAllEnquiryCategories()
        return res.json(data)
    } catch(err: any){
        return res.status(500).json({ error: err.message ?? "Server error" })
    }
}