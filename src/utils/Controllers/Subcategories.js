import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiSubcategories {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/api/subcategories`)
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/api/subcategories`, data, {showSuccessToast:"Subcategory successfully added"})
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/api/subcategories/${id}`, data, {showSuccessToast:"Subcategory successfully updated"})
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/api/subcategories/${id}`, {showSuccessToast:"Subcategory successfully deleted"})
        return response;
    }
}

export { apiSubcategories};