import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiCategories {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/categories`)
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/categories`, data, {showSuccessToast:"Kategoriya yaratildi"})
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/categories/${id}`, data, {showSuccessToast:"Kategoriya yangilandi"})
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/categories/${id}`, {showSuccessToast:"Kategoriya o'chirildi"})
        return response;
    }
}

export { apiCategories};