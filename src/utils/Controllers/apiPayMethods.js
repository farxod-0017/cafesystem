import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiPayMethods {
    static getAll = async () => {
        const response = await $api.get(`${BASE_URL}/payMethod`)
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/payMethod`, data, { showSuccessToast: "To'lov usuli yaratildi" })
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/payMethod/${id}`, data, { showSuccessToast: "To'lov usuli o'zgartirildi" })
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/payMethod/${id}`, { showSuccessToast: "To'lov usuli o'chirildi" })
        return response;
    }
}

export { apiPayMethods };