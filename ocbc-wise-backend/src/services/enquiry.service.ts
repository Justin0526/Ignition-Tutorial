import { supabase } from "../lib/supabase.js"

export async function getTop5EnquiryCategories(){
    const { data, error } = await supabase
        .from("enquiry_category_counts")
        .select("name, total_enquiries, escalated_enquiries")
        .limit(5)

        if (error) throw new Error(error.message)
            return data
}

export async function getTop5EscalatedEnquiries(){
    const { data, error } = await supabase
        .from("escalated_enquiry_category_counts")
        .select("name, total_enquiries, escalated_enquiries")
        .limit(5)

        if (error) throw new Error(error.message)
            return data
}