import { supabase } from "../lib/supabase.js"

export async function getTop5EnquiryCategories(){
    const { data, error } = await supabase
        .from("enquiry_category_counts")
        .select("name,total")
        .limit(5)

        if (error) throw new Error(error.message)
            return data
}